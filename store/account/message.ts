import {
  MsgSend,
  MsgDeposit,
  MsgWithdraw,
  MsgExternalTransfer,
  denomAmountToChainDenomAmountToFixed
} from '@injectivelabs/sdk-ts'

import { BigNumberInBase } from '@injectivelabs/utils'
import { TokenStatic } from '@injectivelabs/token-metadata'
import { backupPromiseCall } from '@/app/utils/async'

export const deposit = async ({
  amount,
  token,
  subaccountId
}: {
  amount: BigNumberInBase
  token: TokenStatic
  subaccountId?: string
}) => {
  const accountStore = useAccountStore()
  const appStore = useAppStore()
  const walletStore = useWalletStore()

  if (!accountStore.subaccountId || !walletStore.isUserWalletConnected) {
    return
  }

  await appStore.queue()
  await walletStore.validate()

  const message = MsgDeposit.fromJSON({
    injectiveAddress: walletStore.authZOrInjectiveAddress,
    subaccountId: subaccountId || accountStore.subaccountId,
    amount: {
      denom: token.denom,
      amount: denomAmountToChainDenomAmountToFixed({
        value: amount.toFixed(),
        decimals: token.decimals
      })
    }
  })

  await walletStore.broadcastMessages(message)

  await backupPromiseCall(() => accountStore.fetchAccountPortfolioBalances())
}

export const withdraw = async ({
  amount,
  token,
  subaccountId
}: {
  amount: BigNumberInBase
  token: TokenStatic
  subaccountId?: string
}) => {
  const accountStore = useAccountStore()
  const appStore = useAppStore()
  const walletStore = useWalletStore()

  if (!accountStore.subaccountId || !walletStore.isUserWalletConnected) {
    return
  }

  await appStore.queue()
  await walletStore.validate()

  const message = MsgWithdraw.fromJSON({
    injectiveAddress: walletStore.authZOrInjectiveAddress,
    subaccountId: subaccountId || accountStore.subaccountId,
    amount: {
      denom: token.denom,
      amount: denomAmountToChainDenomAmountToFixed({
        value: amount.toFixed(),
        decimals: token.decimals
      })
    }
  })

  await walletStore.broadcastMessages(message)

  await backupPromiseCall(() => accountStore.fetchAccountPortfolioBalances())
}

export const transfer = async ({
  amount,
  denom,
  memo,
  destination,
  token
}: {
  amount: BigNumberInBase
  denom: string
  memo?: string
  destination: string
  token: TokenStatic
}) => {
  const accountStore = useAccountStore()
  const appStore = useAppStore()
  const walletStore = useWalletStore()

  if (!walletStore.isUserWalletConnected) {
    return
  }

  await appStore.queue()
  await walletStore.validate()

  const message = MsgSend.fromJSON({
    srcInjectiveAddress: walletStore.authZOrInjectiveAddress,
    dstInjectiveAddress: destination,
    amount: {
      denom,
      amount: amount.toWei(token.decimals).toFixed()
    }
  })

  await walletStore.broadcastMessages(message, memo)

  await backupPromiseCall(() => accountStore.fetchAccountPortfolioBalances())
}

export const externalTransfer = async ({
  amount,
  denom,
  memo,
  srcSubaccountId,
  dstSubaccountId,
  token
}: {
  amount: BigNumberInBase
  denom: string
  memo?: string
  srcSubaccountId: string
  dstSubaccountId: string
  token: TokenStatic
}) => {
  const accountStore = useAccountStore()
  const appStore = useAppStore()
  const walletStore = useWalletStore()

  if (!walletStore.isUserWalletConnected) {
    return
  }

  await appStore.queue()
  await walletStore.validate()

  const message = MsgExternalTransfer.fromJSON({
    srcSubaccountId,
    dstSubaccountId,
    injectiveAddress: walletStore.authZOrInjectiveAddress,
    amount: {
      denom,
      amount: amount.toWei(token.decimals).toFixed()
    }
  })

  await walletStore.broadcastMessages(message, memo)

  await backupPromiseCall(() => accountStore.fetchAccountPortfolioBalances())
}

export const withdrawToMain = async () => {
  const appStore = useAppStore()
  const walletStore = useWalletStore()
  const accountStore = useAccountStore()

  if (!accountStore.subaccountId || !walletStore.isUserWalletConnected) {
    return
  }

  await appStore.queue()
  await walletStore.validate()

  const msgs = accountStore.subaccountBalancesMap[accountStore.subaccountId]
    .filter((balance) =>
      new BigNumberInBase(balance.availableBalance)
        .dp(0, BigNumberInBase.ROUND_DOWN)
        .gt(0)
    )
    .map((balance) =>
      MsgWithdraw.fromJSON({
        injectiveAddress: walletStore.authZOrInjectiveAddress,
        subaccountId: accountStore.subaccountId,
        amount: {
          amount: new BigNumberInBase(balance.availableBalance).toFixed(
            0,
            BigNumberInBase.ROUND_DOWN
          ),
          denom: balance.denom
        }
      })
    )

  await walletStore.broadcastMessages(msgs)

  await backupPromiseCall(() => accountStore.fetchAccountPortfolioBalances())
}
