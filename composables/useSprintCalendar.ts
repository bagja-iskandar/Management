import { ref, computed } from 'vue'

export function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function getSunday(monday: Date): Date {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return sunday
}

export function getWeekNumber(d: Date): number {
  const target = new Date(d.valueOf())
  const dayNr = (d.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
}

export function toIsoDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useSprintCalendar() {
  const weekOffset = ref(0) // 0 = Current Week, -1 = Prev Week, +1 = Next Week

  const baseDate = computed(() => {
    const d = new Date()
    d.setDate(d.getDate() + weekOffset.value * 7)
    return d
  })

  const currentMonday = computed(() => getMonday(baseDate.value))
  const currentSunday = computed(() => getSunday(currentMonday.value))
  const weekNum = computed(() => getWeekNumber(currentMonday.value))
  const isCurrentWeek = computed(() => weekOffset.value === 0)

  const weekLabel = computed(() => {
    const start = currentMonday.value
    const end = currentSunday.value
    const startDay = start.getDate()
    const endDay = end.getDate()
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
    const startYear = start.getFullYear()
    const endYear = end.getFullYear()

    if (startYear !== endYear) {
      return `Week ${weekNum.value} · ${startDay} ${startMonth} ${startYear} – ${endDay} ${endMonth} ${endYear}`
    }
    if (startMonth !== endMonth) {
      return `Week ${weekNum.value} · ${startDay} ${startMonth} – ${endDay} ${endMonth} ${startYear}`
    }
    return `Week ${weekNum.value} · ${startDay}–${endDay} ${startMonth} ${startYear}`
  })

  const remainingDaysText = computed(() => {
    if (!isCurrentWeek.value) {
      if (weekOffset.value < 0) {
        const pastWeeks = Math.abs(weekOffset.value)
        return pastWeeks === 1 ? 'Past week · Cycle closed' : `${pastWeeks} weeks ago · Closed`
      } else {
        const futureWeeks = weekOffset.value
        return futureWeeks === 1 ? 'Next cycle · Starts soon' : `In ${futureWeeks} weeks`
      }
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(currentSunday.value.getFullYear(), currentSunday.value.getMonth(), currentSunday.value.getDate())
    const diffDays = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return 'Final day of cycle'
    if (diffDays === 1) return '1 day remaining'
    return `${diffDays} days remaining`
  })

  function goToPrevWeek() {
    weekOffset.value--
  }

  function goToNextWeek() {
    weekOffset.value++
  }

  function goToCurrentWeek() {
    weekOffset.value = 0
  }

  return {
    weekOffset,
    baseDate,
    currentMonday,
    currentSunday,
    weekNum,
    isCurrentWeek,
    weekLabel,
    remainingDaysText,
    goToPrevWeek,
    goToNextWeek,
    goToCurrentWeek,
    toIsoDate
  }
}
