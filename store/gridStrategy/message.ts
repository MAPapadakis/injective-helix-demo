import {
  ExitType,
  ExitConfig,
  MsgExecuteContractCompat,
  ExecArgRemoveGridStrategy,
  spotPriceToChainPriceToFixed,
  ExecArgCreateSpotGridStrategy,
  spotQuantityToChainQuantityToFixed,
  MsgGrant,
  Msgs
} from '@injectivelabs/sdk-ts'
import { GeneralException } from '@injectivelabs/exceptions'
import { BigNumberInBase } from '@injectivelabs/utils'
import { UiSpotMarketWithToken } from '@injectivelabs/sdk-ui-ts'
import { backupPromiseCall } from '@/app/utils/async'
import {
  gridStrategyAuthorizationMessageTypes,
  spotGridMarkets
} from '@/app/data/grid-strategy'
import { addressAndMarketSlugToSubaccountId } from '@/app/utils/helpers'
import { msgBroadcastClient } from '@/app/Services'
import { SpotGridTradingForm, SpotGridTradingField } from '@/types'

export const createStrategy = async (
  {
    [SpotGridTradingField.Grids]: grids,
    [SpotGridTradingField.StopLoss]: stopLoss,
    [SpotGridTradingField.ExitType]: exitType,
    [SpotGridTradingField.UpperPrice]: upperPrice,
    [SpotGridTradingField.LowerPrice]: lowerPrice,
    [SpotGridTradingField.TakeProfit]: takeProfit,
    [SpotGridTradingField.SettleIn]: isSettleInEnabled,
    [SpotGridTradingField.QuoteInvestmentAmount]: quoteAmount,
    [SpotGridTradingField.BaseInvestmentAmount]: baseAmount,
    [SpotGridTradingField.SellBaseOnStopLoss]: isSellBaseOnStopLossEnabled,
    [SpotGridTradingField.BuyBaseOnTakeProfit]: isBuyBaseOnTakeProfitEnabled,
    [SpotGridTradingField.StrategyType]: strategyType
  }: Partial<SpotGridTradingForm>,
  market?: UiSpotMarketWithToken
) => {
  const appStore = useAppStore()
  const authZStore = useAuthZStore()
  const walletStore = useWalletStore()
  const accountStore = useAccountStore()
  const gridStrategyStore = useGridStrategyStore()

  const levels = Number(grids)

  if (!walletStore.injectiveAddress) {
    return
  }

  if (!baseAmount && !quoteAmount) {
    return
  }

  if (!lowerPrice || !upperPrice) {
    return
  }

  await appStore.queue()
  await walletStore.validate()

  if (walletStore.isAuthzWalletConnected) {
    throw new GeneralException(new Error('AuthZ not supported for this action'))
  }

  const _market = market || gridStrategyStore.spotMarket

  if (!_market) {
    return
  }

  const gridMarket = spotGridMarkets.find(
    (market) => market.slug === _market.slug
  )

  if (!gridMarket) {
    return
  }

  const gridStrategySubaccountId = addressAndMarketSlugToSubaccountId(
    walletStore.address,
    gridMarket.slug
  )

  const funds = []

  if (baseAmount && !new BigNumberInBase(baseAmount).eq(0)) {
    funds.push({
      denom: _market.baseToken.denom,
      amount: spotQuantityToChainQuantityToFixed({
        value: baseAmount,
        baseDecimals: _market.baseToken.decimals
      })
    })
  }

  if (quoteAmount && !new BigNumberInBase(quoteAmount).eq(0)) {
    funds.push({
      denom: _market.quoteToken.denom,
      amount: spotQuantityToChainQuantityToFixed({
        value: quoteAmount,
        baseDecimals: _market.quoteToken.decimals
      })
    })
  }

  const stopLossValue: ExitConfig | undefined = stopLoss
    ? {
        exitPrice: spotPriceToChainPriceToFixed({
          value: stopLoss,
          baseDecimals: _market.baseToken.decimals,
          quoteDecimals: _market.quoteToken.decimals
        }),
        exitType: isSellBaseOnStopLossEnabled
          ? ExitType.Quote
          : ExitType.Default
      }
    : undefined

  const takeProfitValue: ExitConfig | undefined = takeProfit
    ? {
        exitPrice: spotPriceToChainPriceToFixed({
          value: takeProfit,
          baseDecimals: _market.baseToken.decimals,
          quoteDecimals: _market.quoteToken.decimals
        }),
        exitType: isBuyBaseOnTakeProfitEnabled
          ? ExitType.Base
          : ExitType.Default
      }
    : undefined

  const message = MsgExecuteContractCompat.fromJSON({
    contractAddress: gridMarket.contractAddress,
    sender: walletStore.injectiveAddress,
    execArgs: ExecArgCreateSpotGridStrategy.fromJSON({
      levels,
      stopLoss: stopLossValue,
      takeProfit: takeProfitValue,
      subaccountId: gridStrategySubaccountId,
      lowerBound: spotPriceToChainPriceToFixed({
        value: lowerPrice,
        baseDecimals: _market.baseToken.decimals,
        quoteDecimals: _market.quoteToken.decimals
      }),
      upperBound: spotPriceToChainPriceToFixed({
        value: upperPrice,
        baseDecimals: _market.baseToken.decimals,
        quoteDecimals: _market.quoteToken.decimals
      }),
      exitType: isSettleInEnabled && exitType ? exitType : ExitType.Default,
      strategyType
    }),

    funds
  })

  const grantAuthZMessages = gridStrategyAuthorizationMessageTypes.map(
    (messageType) =>
      MsgGrant.fromJSON({
        messageType: `/${messageType}`,
        grantee: gridMarket.contractAddress,
        granter: walletStore.injectiveAddress
      })
  )

  const isAuthorized = gridStrategyAuthorizationMessageTypes.every((m) =>
    authZStore.granterGrants.some(
      (g) =>
        g.authorization.endsWith(m) && g.grantee === gridMarket?.contractAddress
    )
  )

  const msgs: Msgs[] = []

  if (!isAuthorized) {
    msgs.push(...grantAuthZMessages)
  }
  // we need to add it after the authz messages
  msgs.push(message)

  await msgBroadcastClient.broadcastWithFeeDelegation({
    msgs,
    injectiveAddress: walletStore.injectiveAddress
  })

  backupPromiseCall(() => gridStrategyStore.fetchAllStrategies())
  backupPromiseCall(() => accountStore.fetchAccountPortfolioBalances())
  backupPromiseCall(() => authZStore.fetchGrants())
}

export const removeStrategy = async (contractAddress?: string) => {
  const appStore = useAppStore()
  const walletStore = useWalletStore()
  const accountStore = useAccountStore()
  const gridStrategyStore = useGridStrategyStore()

  if (!walletStore.isUserWalletConnected) {
    return
  }

  if (!gridStrategyStore.spotMarket) {
    return
  }

  await appStore.queue()
  await walletStore.validate()

  if (walletStore.isAuthzWalletConnected) {
    throw new GeneralException(new Error('AuthZ not supported for this action'))
  }

  const gridMarket = spotGridMarkets.find(
    (m) => m.slug === gridStrategyStore.spotMarket!.slug
  )

  if (!gridMarket) {
    return
  }

  const gridStrategySubaccountId = addressAndMarketSlugToSubaccountId(
    walletStore.address,
    gridStrategyStore.spotMarket.slug
  )

  const message = MsgExecuteContractCompat.fromJSON({
    contractAddress: contractAddress || gridMarket.contractAddress,
    sender: walletStore.injectiveAddress,
    execArgs: ExecArgRemoveGridStrategy.fromJSON({
      subaccountId: gridStrategySubaccountId
    })
  })

  await msgBroadcastClient.broadcastWithFeeDelegation({
    msgs: message,
    injectiveAddress: walletStore.injectiveAddress
  })

  backupPromiseCall(() => gridStrategyStore.fetchAllStrategies())
  backupPromiseCall(() => accountStore.fetchAccountPortfolioBalances())
}

export const removeStrategyForSubaccount = async (
  contractAddress?: string,
  subaccountId?: string
) => {
  const appStore = useAppStore()
  const walletStore = useWalletStore()
  const accountStore = useAccountStore()
  const gridStrategyStore = useGridStrategyStore()

  if (!walletStore.isUserWalletConnected) {
    return
  }

  if (!contractAddress) {
    return
  }

  await appStore.queue()
  await walletStore.validate()

  if (walletStore.isAuthzWalletConnected) {
    throw new GeneralException(new Error('AuthZ not supported for this action'))
  }

  const message = MsgExecuteContractCompat.fromJSON({
    contractAddress,
    sender: walletStore.injectiveAddress,
    execArgs: ExecArgRemoveGridStrategy.fromJSON({
      subaccountId: subaccountId || accountStore.subaccountId
    })
  })

  await msgBroadcastClient.broadcastWithFeeDelegation({
    msgs: message,
    injectiveAddress: walletStore.injectiveAddress
  })

  backupPromiseCall(() => gridStrategyStore.fetchStrategies())
  backupPromiseCall(() => accountStore.fetchAccountPortfolioBalances())
}
