export const defaultUnitById = {
  '001': '个',
  '002': '个',
  '003': '个',
  '004': '瓶',
  '005': '个',
  '006': '个',
  '007': '根',
  '008': 'g',
  '009': 'g',
  '010': '个',
}


export function getDefaultUnit(ingredientId) {
  return defaultUnitById[ingredientId] || '个'
}


export function parseQuantityText(
  value,
  fallbackUnit = '个'
) {
  const text = value.trim()

  const match = text.match(
    /^(\d+(?:\.\d+)?)\s*(.*)$/
  )

  if (!match) {
    return {
      quantity: 1,
      unit: fallbackUnit,
    }
  }

  return {
    quantity: Number(match[1]),
    unit:
      match[2].trim() ||
      fallbackUnit,
  }
}