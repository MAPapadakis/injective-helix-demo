import { defineNuxtPlugin } from '#app'
import { getEthereumAddress } from '@injectivelabs/sdk-ts'
import { NUMBER_REGEX } from '@injectivelabs/sdk-ui-ts'
import { defineRule } from 'vee-validate'
import { BigNumberInBase } from '@injectivelabs/utils'
import { defineTradeRules } from '@/app/client/utils/validation/trade'
import { UI_DEFAULT_MIN_DISPLAY_DECIMALS } from '@/app/utils/constants'
import { SpotGridTradingField } from 'types'

const formatFieldName = (value: string) => value.replace(/[^a-z]+/gi, '')

export const errorMessages = {
  email: () => 'This field should be a valid email',
  injAddress: () => 'This field is not a valid Injective address',
  positiveNumber: () => 'This field is not a valid number',
  integer: (fieldName: string) => `${fieldName} must be > 0`
} as Record<string, (_field?: string, _params?: Record<string, any>) => string>

export const defineGlobalRules = () => {
  defineRule('email', (value: string) => {
    const validEmailPattern =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

    if (!validEmailPattern.test(String(value))) {
      return errorMessages.email()
    }

    return true
  })

  defineRule('between', (value: string, [min, max]: string[]) => {
    const valueIsOutOfBounds =
      Number(min) > Number(value) || Number(max) < Number(value)

    if (valueIsOutOfBounds) {
      return `${
        max <= min
          ? `Your input value of ${value} cannot be higher than ${max}`
          : `This field should be between ${min} and ${max}`
      }`
    }

    return true
  })

  defineRule('minValue', (value: string, [min]: string[]) => {
    if (Number(value) < Number(min)) {
      return `This field should be greater than ${min}`
    }

    return true
  })

  defineRule(
    'required',
    (value: string | number, _, { field }: { field: string }) => {
      if (!value || !value.toString().length || Number(value) === 0) {
        if (field.toLowerCase().includes('amount')) {
          return 'amount is required'
        }

        return `${formatFieldName(field)} is required.`
      }

      return true
    }
  )

  defineRule('injAddress', (value: string) => {
    try {
      getEthereumAddress(value)

      return true
    } catch (error: any) {
      return errorMessages.injAddress()
    }
  })

  defineRule('positiveNumber', (value: string) => {
    if (NUMBER_REGEX.test(value)) {
      return true
    }

    return errorMessages.positiveNumber()
  })

  defineRule('positiveNumber', (value: string) => {
    if (NUMBER_REGEX.test(value)) {
      return true
    }

    return errorMessages.positiveNumber()
  })

  defineRule('integer', (value: string, [fieldName]: string[]) => {
    const valueInBigNumber = new BigNumberInBase(value || 0)

    if (valueInBigNumber.lte(0)) {
      return errorMessages.integer(fieldName)
    }

    return true
  })

  defineRule('betweenSgt', (value: string, [min, max]: string[]) => {
    const valueInBigNumber = new BigNumberInBase(value)
    const minInBigNumber = new BigNumberInBase(min)
    const maxInBigNumber = new BigNumberInBase(max)

    const isBetween =
      valueInBigNumber.lte(maxInBigNumber) &&
      valueInBigNumber.gte(minInBigNumber)

    if (!isBetween) {
      return `Value must be between: ${min} and ${max}`
    }

    return true
  })

  defineRule('invalidIfBetween', (value: string, [min, max]: string[]) => {
    const valueInBigNumber = new BigNumberInBase(value)
    const minInBigNumber = new BigNumberInBase(min)
    const maxInBigNumber = new BigNumberInBase(max)

    const isBetween =
      valueInBigNumber.lte(maxInBigNumber) &&
      valueInBigNumber.gte(minInBigNumber)

    if (isBetween) {
      return `Price range must be outside of ${minInBigNumber.toFixed(
        UI_DEFAULT_MIN_DISPLAY_DECIMALS
      )} - ${maxInBigNumber.toFixed(UI_DEFAULT_MIN_DISPLAY_DECIMALS)}`
    }

    return true
  })

  defineRule('requiredSgt', (value: string) => {
    if (!value) {
      return 'Field is required'
    }

    return true
  })

  defineRule('minValueSgt', (value: string, [min]: string[]) => {
    const valueInBigNumber = new BigNumberInBase(value)

    if (valueInBigNumber.lt(min)) {
      return `Minimum amount should be ${min}`
    }

    return true
  })

  defineRule('greaterThanSgt', (value: string, [min]: string[]) => {
    const valueInBigNumber = new BigNumberInBase(value)
    const minInBigNumber = new BigNumberInBase(min)

    if (valueInBigNumber.lte(minInBigNumber)) {
      return `Value should be greater than ${minInBigNumber.toFixed(2)}`
    }

    return true
  })

  defineRule('lessThanSgt', (value: string, [max]: string[]) => {
    const valueInBigNumber = new BigNumberInBase(value)
    const maxInBigNumber = new BigNumberInBase(max)

    if (valueInBigNumber.gte(maxInBigNumber)) {
      return `Value should be less than ${maxInBigNumber.toFixed(2)}`
    }

    return true
  })

  defineRule('minInvestmentSgt', (value: string, [min]: string[]) => {
    const valueInBigNumber = new BigNumberInBase(value)

    if (valueInBigNumber.lt(min)) {
      return `Minimum USDT investment required to run this grid strategy is ${min}`
    }

    return true
  })

  defineRule('insufficientSgt', (value: string, [max]: string[]) => {
    const valueInBigNumber = new BigNumberInBase(value)

    if (valueInBigNumber.gt(max)) {
      return `Insufficient Amount`
    }

    return true
  })

  defineRule(
    'minBaseAndQuoteAmountSgt',
    (_value: string, [amountA, amountB, threshold, symbol]: string[]) => {
      const amountAInBigNumber = new BigNumberInBase(amountA)
      const amountBInBigNumber = new BigNumberInBase(amountB)

      const thresholdInBigNumber = new BigNumberInBase(threshold)

      if (
        amountAInBigNumber.plus(amountBInBigNumber).lt(thresholdInBigNumber)
      ) {
        return `Min ${symbol.toUpperCase()}+USDT value >= $${thresholdInBigNumber.toFixed(
          UI_DEFAULT_MIN_DISPLAY_DECIMALS
        )}`
      }

      return true
    }
  )

  defineRule('requiredIfEmpty', (value: string, [fieldValue]: string[]) => {
    if (!fieldValue && !value) {
      return 'At least one field is required'
    }

    return true
  })

  defineRule(
    'rangeSgt',
    (_: string, [lower, upper, levels, minPriceTickSize]: string[]) => {
      const upperInBigNumber = new BigNumberInBase(upper)
      const threshold = new BigNumberInBase(levels)
        .times(minPriceTickSize)
        .times(10)

      if (upperInBigNumber.minus(lower).lt(threshold)) {
        return 'The price range provided cannot support that many grids. Please lower the number of grids'
      }
      return true
    }
  )

  defineRule(
    'singleSided',
    (_: string, [lower, upper, currentPrice, field]: string[]) => {
      const currentPriceInBigNumber = new BigNumberInBase(currentPrice)

      const lowerThreshold = currentPriceInBigNumber.plus(
        currentPriceInBigNumber.times(0.01)
      )
      const upperThreshold = currentPriceInBigNumber.minus(
        currentPriceInBigNumber.times(0.01)
      )

      if (field === SpotGridTradingField.LowerPrice) {
        if (
          currentPriceInBigNumber.lt(lower) &&
          currentPriceInBigNumber.lt(upper) &&
          lowerThreshold.gt(lower)
        ) {
          return `Lower price level should be above ${lowerThreshold.toFixed(
            2
          )}`
        }
      }

      if (field === SpotGridTradingField.UpperPrice) {
        if (
          currentPriceInBigNumber.gt(lower) &&
          currentPriceInBigNumber.gt(upper) &&
          upperThreshold.lt(upper)
        ) {
          return `Upper price level should be below ${upperThreshold.toFixed(
            2
          )}`
        }
      }

      return true
    }
  )
}

export default defineNuxtPlugin(() => {
  defineGlobalRules()
  defineTradeRules()
})
