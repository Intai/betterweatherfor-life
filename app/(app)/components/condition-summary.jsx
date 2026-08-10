'use client'

import { getConditionColor, isWarningCondition } from '@/app/(app)/utils/condition-colors'

/**
 * A tinted summary box for AI generated text, coloured by condition.
 * Marginal and unsuitable conditions tint both the box and the text with the
 * condition colour, other conditions fall back to neutral secondary styling.
 *
 * @param {object} props
 * @param {string} props.condition - Condition level (ideal, acceptable, marginal, unsuitable).
 * @param {string|string[]} props.children - A single paragraph, or one string per paragraph.
 * @param {string} [props.className] - Additional classes for the box, e.g. rounding and padding.
 * @param {string} [props.data-testid] - Test id for the box.
 */
export default function ConditionSummary({
  condition,
  children,
  className = '',
  'data-testid': dataTestid,
}) {
  const showWarning = isWarningCondition(condition)
  const conditionColor = getConditionColor(condition)

  const boxStyle = showWarning
    ? { backgroundColor: `color-mix(in srgb, ${conditionColor} 10%, transparent)` }
    : undefined

  const textStyle = showWarning
    ? { color: conditionColor }
    : undefined

  const paragraphs = Array.isArray(children) ? children : [children]

  return (
    <div
      className={`${boxStyle ? '' : 'bg-secondary'} ${className}`}
      style={boxStyle}
      data-testid={dataTestid}
    >
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className={`text-sm leading-relaxed ${textStyle ? '' : 'text-muted-foreground'} ${
            index < paragraphs.length - 1 ? 'mb-3' : ''
          }`}
          style={textStyle}
        >
          {paragraph}
        </p>
      ))}
    </div>
  )
}
