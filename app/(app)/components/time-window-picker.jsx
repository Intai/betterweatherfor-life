import { TODAY, TOMORROW } from '@/app/(app)/constants'
import TimeWindowPickerCalendar from './time-window-picker-calendar'
import TimeWindowPickerMenu from './time-window-picker-menu'

export default function TimeWindowPicker() {
  return (
    <section className="px-4 py-3 border-b bg-muted/10">
      <div className="flex items-center gap-2" data-testid="time-window-picker">
        <TimeWindowPickerMenu day={TODAY} />
        <TimeWindowPickerMenu day={TOMORROW} />
        <TimeWindowPickerCalendar />
      </div>
    </section>
  )
}
