import { I18nMessageFunction } from '@/types'

export default {
  tradeAndEarn: {
    title: 'Trade & Earn',
    description:
      'Earn INJ by trading on the Spot and Perpetual trading pages or using a trading bot',

    pts: 'pts',
    makerPoints: 'maker pts',
    takerPoints: 'taker pts',
    estRewards: 'Est. Rewards',
    estRewardsTooltip: ({ named }: I18nMessageFunction) =>
      `Estimated reward to be distributed to this address based on your reward points /  total reward points * total allocated rewards. This is calculated assuming that your reward points grow just as fast as total reward points until the end of the campaign.  In order to maintain or maximize your reward, you should maintain the same or higher trading activity until the end of the campaign. Rewards amount is capped at ${named(
        'maxRewards'
      )} INJ or the equivalent amount of INJ staked, whichever is higher`,
    stakeNow: 'Stake now',
    stakeMore: 'Stake more',
    maxCampaignRewards: 'Total allocated Rewards',
    maxCampaignRewardsTooltip:
      'The total number of INJ that will be distributed in this epoch. Reward distribution will happen at the end of the vesting period after each campaign is finished.',
    currentEpoch: 'Current Epoch',
    pendingRewards: 'Pending Rewards',
    emptyPendingRewards: 'No pending rewards available.',
    campaignEndingOn: ({ named }: I18nMessageFunction) =>
      `Ending on ${named('date')}`,
    campaignAsOf: ({ named }: I18nMessageFunction) => `As of ${named('date')}`,
    myRewardPoints: 'My Reward Points / Total Reward Points',
    myRewardPoints_tooltip:
      'The current reward points you earned during this campaign and the total reward points in the campaign. Reward points will reset to 0 at the beginning of next campaign.',
    pending_max_campaign_rewards: 'Total allocated Rewards',
    pending_max_campaign_rewards_tooltip:
      'The total number of INJ that was distributed in the previous epoch. Reward distribution will happen at the end of the vesting period.',
    estRewardsStake: 'Est. Rewards',
    estRewardsStakeTooltip: ({ named }: I18nMessageFunction) =>
      `Estimated reward to be distributed to this address based on your reward points /  total reward points * total allocated rewards. This is calculated assuming that your reward points grow just as fast as total reward points until the end of the campaign.  In order to maintain or maximize your reward, you should maintain the same or higher trading activity until the end of the campaign. Rewards amount is capped at ${named(
        'maxRewards'
      )} INJ or the equivalent amount of INJ staked, whichever is higher`,
    stake_total_to_receive_full_amount: ({ named }: I18nMessageFunction) =>
      `Stake total of ${named('total')} INJ to receive the full amount`
  }
}
