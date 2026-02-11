'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { prop } from 'ramda'
import { TIME_RANGES } from '@/app/(app)/constants'
import { useForecastStore } from '@/app/(app)/stores/forecast-store'
import { kebabToCamel } from '@/app/utils/string'
import { Button } from '@/shadcn/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/shadcn/components/ui/dropdown-menu'

export default function TimeWindowPickerMenu({ day }) {
  const { t } = useTranslation()
  const selectedDay = useForecastStore(prop('selectedDay'))
  const selectedTimeRange = useForecastStore(prop('selectedTimeRange'))
  const setDay = useForecastStore(prop('setDay'))
  const setTimeRange = useForecastStore(prop('setTimeRange'))
  const [open, setOpen] = useState(false)
  const isSelected = selectedDay === day
  const getTimeRangeLabel = range => t(`home.timeWindow.${kebabToCamel(range)}`)

  const handleOpenChange = nextOpen => {
    if (nextOpen) setDay(day)
    setOpen(nextOpen)
  }

  const label = t(`home.timeWindow.${day}`, {
    range: getTimeRangeLabel(selectedTimeRange),
    context: isSelected ? 'withRange' : undefined,
  })

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isSelected ? 'default' : 'secondary'}
          className="rounded-full whitespace-nowrap"
          data-testid={`${day}-button`}
        >
          {label}
          {isSelected && <ChevronDown className="w-4 h-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup
          value={selectedTimeRange}
          onValueChange={value => setTimeRange(value)}
        >
          {TIME_RANGES.map(range => (
            <DropdownMenuRadioItem key={range} value={range}>
              {getTimeRangeLabel(range)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
