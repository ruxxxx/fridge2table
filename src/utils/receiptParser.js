import ingredients from '../data/ingredients'


/* =========================================================
   TODAY
========================================================= */

function getTodayString() {
  const today =
    new Date()

  const year =
    today.getFullYear()

  const month =
    String(
      today.getMonth() + 1
    ).padStart(
      2,
      '0'
    )

  const day =
    String(
      today.getDate()
    ).padStart(
      2,
      '0'
    )

  return `${year}-${month}-${day}`
}


/* =========================================================
   INGREDIENT ALIASES

   OCR 小票通常不会直接写中文，
   所以把英文商品名称映射到你的食材。
========================================================= */

const aliasMap = {

  '001': [
    'potatoes',
    'potato',
  ],

  '002': [
    'truss tomato',
    'roma tomato',
    'tomatoes',
    'tomato',
  ],

  '003': [
    'free range eggs',
    'free range egg',
    'cage free eggs',
    'cage eggs',
    'eggs',
    'egg',
  ],

  '004': [
    'full cream milk',
    'skim milk',
    'lite milk',
    'low fat milk',
    'milk',
  ],

  '005': [
    'eggplant',
    'aubergine',
  ],

  '006': [
    'green capsicum',
    'green pepper',
    'bell pepper',
    'capsicum',
  ],

  '007': [
    'carrots',
    'carrot',
  ],

  '008': [
    'chicken breast',
    'chicken thigh',
    'chicken thighs',
    'chicken drumstick',
    'chicken drumsticks',
    'chkn breast',
    'chkn',
    'chicken',
  ],

  '009': [
    'beef mince',
    'ground beef',
    'beef steak',
    'beef strips',
    'beef',
  ],

  '010': [
    'brown onion',
    'red onion',
    'white onion',
    'onions',
    'onion',
  ],
}


/* =========================================================
   EXTRA SCAN INGREDIENTS

   暂时不占用你的 001–010 ID。
========================================================= */

const extraScanIngredients = [
  {
    ingredientId: null,
    key: 'pork-ribs',

    name: '排骨',

    category: '肉类',

    image:
      '/images/ingredients/ingredient-pork-1.png',

    defaultUnit: 'g',

    defaultExpiryDays: 5,

    aliases: [
      'pork spare ribs',
      'pork ribs',
      'pork rib',
      'spare ribs',
    ],
  },

  {
    ingredientId: null,
    key: 'pork',

    name: '猪肉',

    category: '肉类',

    image:
      '/images/ingredients/ingredient-pork-2.png',

    defaultUnit: 'g',

    defaultExpiryDays: 5,

    aliases: [
      'pork loin',
      'pork chops',
      'pork chop',
      'pork steak',
      'pork',
    ],
  },
]


/* =========================================================
   BUILD SEARCH CATALOG
========================================================= */

const masterCatalog =
  ingredients.map(
    (ingredient) => ({

      ingredientId:
        ingredient.id,

      key:
        `ingredient-${ingredient.id}`,

      name:
        ingredient.name,

      category:
        ingredient.category,

      image:
        ingredient.image,

      defaultUnit:
        ingredient.defaultUnit,

      defaultExpiryDays:
        ingredient.defaultExpiryDays,

      aliases:
        aliasMap[
          ingredient.id
        ] || [],
    })
  )


const catalog = [
  ...masterCatalog,
  ...extraScanIngredients,
]


/*
  Alias 长的优先。

  例如：
  eggplant 必须先于 egg，
  pork ribs 必须先于 pork。
*/

const searchableAliases =
  catalog
    .flatMap(
      (ingredient) =>

        ingredient.aliases.map(
          (alias) => ({
            alias:
              alias.toLowerCase(),

            ingredient,
          })
        )
    )
    .sort(
      (a, b) =>
        b.alias.length -
        a.alias.length
    )


/* =========================================================
   NORMALIZE OCR LINE
========================================================= */

function normalizeLine(line) {
  return line
    .toLowerCase()
    .replace(
      /[|]/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
}


/* =========================================================
   IGNORE RECEIPT SYSTEM LINES
========================================================= */

const ignoredWords = [
  'total',
  'subtotal',
  'sub total',
  'eftpos',
  'mastercard',
  'visa',
  'cash',
  'change',
  'balance',
  'payment',
  'gst',
  'tax',
  'saving',
  'savings',
  'receipt',
  'invoice',
  'transaction',
  'approved',
  'thank you',
  'abn',
  'amount',
  'card',
  'loyalty',
]


function shouldIgnoreLine(
  line
) {
  return ignoredWords.some(
    (word) =>
      line.includes(
        word
      )
  )
}


/* =========================================================
   FIND INGREDIENT
========================================================= */

function findIngredient(
  line
) {

  for (
    const item of
    searchableAliases
  ) {

    if (
      line.includes(
        item.alias
      )
    ) {
      return item.ingredient
    }
  }


  return null
}


/* =========================================================
   QUANTITY / WEIGHT

   Examples:
   500g
   0.52kg
   2L
   750ml
   12PK
========================================================= */

function extractQuantity(
  text,
  ingredient
) {

  if (!text) {
    return ''
  }


  const normalized =
    text
      .replace(
        ',',
        '.'
      )
      .toLowerCase()


  /* Weight / Volume */

  const measurementMatch =
    normalized.match(
      /(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/i
    )


  if (
    measurementMatch
  ) {

    return (
      `${measurementMatch[1]}${measurementMatch[2]}`
    )
  }


  /* Pack */

  const packMatch =
    normalized.match(
      /(\d+)\s*(pk|pack)\b/i
    )


  if (packMatch) {

    /*
      鸡蛋 12PK →
      12个
    */

    if (
      ingredient
        .ingredientId ===
      '003'
    ) {

      return (
        `${packMatch[1]}个`
      )
    }


    return (
      `${packMatch[1]}件`
    )
  }


  return ''
}


/* =========================================================
   PARSE RECEIPT TEXT
========================================================= */

export function parseReceiptText(
  rawText
) {

  if (
    !rawText ||
    !rawText.trim()
  ) {
    return []
  }


  const lines =
    rawText
      .split(/\r?\n/)
      .map(
        normalizeLine
      )
      .filter(Boolean)


  const today =
    getTodayString()


  /*
    “扫描到 X 种食材”
    所以同种食材只留一条。
  */

  const foundMap =
    new Map()


  lines.forEach(
    (
      line,
      index
    ) => {

      if (
        shouldIgnoreLine(
          line
        )
      ) {
        return
      }


      const ingredient =
        findIngredient(
          line
        )


      if (!ingredient) {
        return
      }


      /*
        有些 receipt：
        第一行是名称
        第二行才写重量。

        所以同时看看下一行。
      */

      const nextLine =
        lines[
          index + 1
        ] || ''


      let quantityText =
        extractQuantity(
          line,
          ingredient
        )


      if (!quantityText) {

        quantityText =
          extractQuantity(
            nextLine,
            ingredient
          )
      }


      const key =
        ingredient
          .ingredientId ||
        ingredient.key ||
        ingredient.name


      const existing =
        foundMap.get(
          key
        )


      /*
        已经找到同种食材：
        如果之前没找到重量，
        这次有重量，就补进去。
      */

      if (existing) {

        if (
          !existing
            .quantityText &&
          quantityText
        ) {

          foundMap.set(
            key,
            {
              ...existing,

              quantityText,
            }
          )
        }


        return
      }


      foundMap.set(
        key,
        {
          ingredientId:
            ingredient
              .ingredientId,

          name:
            ingredient.name,

          category:
            ingredient.category,

          image:
            ingredient.image,

          quantityText,

          purchaseDate:
            today,

          shelfLife:
            ingredient
              .defaultExpiryDays,

          rawLine:
            line,
        }
      )
    }
  )


  return Array
    .from(
      foundMap.values()
    )
    .map(
      (
        item,
        index
      ) => ({

        id:
          `scan${String(
            index + 1
          ).padStart(
            3,
            '0'
          )}`,

        ...item,
      })
    )
}


export default parseReceiptText