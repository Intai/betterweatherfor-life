'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { addDays, startOfDay } from 'date-fns'
import { ChevronDown } from 'lucide-react'
import { prop } from 'ramda'
import { PICK_DATE, TIME_RANGES } from '@/app/(app)/constants'
import { useForecastStore } from '@/app/(app)/stores/forecast-store'
import { formatShortDate } from '@/app/utils/date'
import { kebabToCamel } from '@/app/utils/string'
import { Button } from '@/shadcn/components/ui/button'
import { Calendar } from '@/shadcn/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shadcn/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/shadcn/components/ui/radio-group'

export default function TimeWindowPickerCalendar() {
  const { t } = useTranslation()
  const selectedDay = useForecastStore(prop('selectedDay'))
  const selectedDate = useForecastStore(prop('selectedDate'))
  const selectedTimeRange = useForecastStore(prop('selectedTimeRange'))
  const setDay = useForecastStore(prop('setDay'))
  const setDate = useForecastStore(prop('setDate'))
  const setTimeRange = useForecastStore(prop('setTimeRange'))
  const [pickDateOpen, setPickDateOpen] = useState(false)
  const getTimeRangeLabel = range => t(`home.timeWindow.${kebabToCamel(range)}`)
  const today = startOfDay(new Date())
  const maxDate = addDays(today, 14)

  const handlePickDateOpenChange = open => {
    if (open) setDay(PICK_DATE)
    setPickDateOpen(open)
  }

  const getPickDateLabel = () => {
    if (selectedDay === PICK_DATE && selectedDate) {
      const dateLabel = formatShortDate(selectedDate)
      return `${dateLabel}: ${getTimeRangeLabel(selectedTimeRange)}`
    }
    return t('home.timeWindow.pickDate')
  }

  return (
    <Popover open={pickDateOpen} onOpenChange={handlePickDateOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={selectedDay === PICK_DATE ? 'default' : 'secondary'}
          className="rounded-full whitespace-nowrap"
          data-testid="pick-date-button"
        >
          {getPickDateLabel()}
          {selectedDay === PICK_DATE && <ChevronDown className="w-4 h-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 pt-3" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={date => setDate(date)}
          startMonth={today}
          endMonth={maxDate}
          disabled={{ before: today, after: maxDate }}
          className="p-0"
          data-testid="pick-date-calendar"
        />
        <RadioGroup
          value={selectedTimeRange}
          onValueChange={value => setTimeRange(value)}
          className="mt-4"
          data-testid="pick-date-radio-group"
        >
          {TIME_RANGES.map(range => (
            <div key={range} className="flex items-center gap-2">
              <RadioGroupItem value={range} id={`time-range-${range}`} />
              <label htmlFor={`time-range-${range}`} className="text-sm cursor-pointer">
                {getTimeRangeLabel(range)}
              </label>
            </div>
          ))}
        </RadioGroup>
      </PopoverContent>
    </Popover>
  )
}
