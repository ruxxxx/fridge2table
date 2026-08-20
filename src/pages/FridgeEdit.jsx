import { useMemo, useState } from 'react'

import ingredients from '../data/ingredients'

import './FridgeEdit.css'


function formatDateInput(date) {
  const value = new Date(date)

  const year =
    value.getFullYear()

  const month = String(
    value.getMonth() + 1
  ).padStart(2, '0')

  const day = String(
    value.getDate()
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}


function getShelfLife(
  addedDate,
  expiryDate
) {
  const start =
    new Date(addedDate)

  const end =
    new Date(expiryDate)

  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  return Math.max(
    0,
    Math.round(
      (end - start) /
        (1000 * 60 * 60 * 24)
    )
  )
}


function parseQuantity(
  text,
  fallbackUnit
) {
  const value =
    text.trim()

  if (!value) {
    return {
      quantity: null,
      unit: fallbackUnit,
    }
  }

  const match =
    value.match(
      /^(\d+(?:\.\d+)?)\s*(.*)$/
    )

  if (!match) {
    return {
      quantity: null,
      unit: fallbackUnit,
    }
  }

  return {
    quantity:
      Number(match[1]),

    unit:
      match[2].trim() ||
      fallbackUnit,
  }
}


function FridgeEdit({
  item,
  onCancel,
  onConfirm,
}) {

  const initialIngredient =
    useMemo(
      () =>
        ingredients.find(
          (ingredient) =>
            ingredient.id ===
            item?.ingredientId
        ) || null,
      [item]
    )


  const [name, setName] =
    useState(
      item?.name || ''
    )


  const [
    quantityText,
    setQuantityText,
  ] = useState(
    item?.quantity === null ||
    item?.quantity === undefined
      ? ''
      : `${item.quantity} ${item.unit || ''}`.trim()
  )


  const [
    purchaseDate,
    setPurchaseDate,
  ] = useState(
    item
      ? formatDateInput(
          item.addedDate
        )
      : ''
  )


  const [
    shelfLife,
    setShelfLife,
  ] = useState(
    item
      ? getShelfLife(
          item.addedDate,
          item.expiryDate
        )
      : 7
  )


  if (!item) {
    return null
  }


  const handleConfirm = () => {

    const cleanName =
      name.trim()

    if (!cleanName) {
      return
    }


    const matchedIngredient =
      ingredients.find(
        (ingredient) =>
          ingredient.name ===
          cleanName
      )


    const fallbackUnit =
      matchedIngredient
        ?.defaultUnit ||
      item.unit ||
      initialIngredient
        ?.defaultUnit ||
      '个'


    const parsedQuantity =
      parseQuantity(
        quantityText,
        fallbackUnit
      )


    const addedDate =
      new Date(
        `${purchaseDate}T00:00:00`
      )


    const expiryDate =
      new Date(
        addedDate
      )


    expiryDate.setDate(
      expiryDate.getDate() +
      Number(
        shelfLife || 0
      )
    )


    onConfirm({
      ...item,

      ingredientId:
        matchedIngredient
          ?.id ??
        item.ingredientId,

      name:
        cleanName,

      category:
        matchedIngredient
          ?.category ||
        item.category,

      image:
        matchedIngredient
          ?.image ||
        item.image,

      quantity:
        parsedQuantity.quantity,

      unit:
        parsedQuantity.unit,

      addedDate,

      expiryDate,
    })
  }


  return (
    <div className="fridge-edit-app">

      <main className="fridge-edit-page">


        {/* Header */}

        <header className="fridge-edit-header">

          <h1>
            编辑食材
          </h1>

          <p>
            修改食材信息和保存期限
          </p>

        </header>



        {/* Card */}

        <section className="fridge-edit-card">

          <h2>
            食材信息
          </h2>


          {/* Name */}

          <label className="fridge-edit-field">

            <span>
              食材名称
            </span>

            <input
              type="text"
              value={name}

              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
            />

          </label>



          {/* Quantity */}

          <label className="fridge-edit-field">

            <span>
              数量
            </span>

            <input
              type="text"
              value={quantityText}
              placeholder="例：500g"

              onChange={(event) =>
                setQuantityText(
                  event.target.value
                )
              }
            />

          </label>



          {/* Purchase Date */}

          <label className="fridge-edit-field">

            <span>
              购买日期
            </span>

            <input
              type="date"
              value={purchaseDate}

              onChange={(event) =>
                setPurchaseDate(
                  event.target.value
                )
              }
            />

          </label>



          {/* Shelf Life */}

          <label className="fridge-edit-field">

            <span>
              保质期 (天)
            </span>

            <input
              type="number"
              min="0"
              value={shelfLife}

              onChange={(event) =>
                setShelfLife(
                  event.target.value
                )
              }
            />

          </label>

        </section>



        {/* Actions */}

        <div className="fridge-edit-actions">

          <button
            className="fridge-edit-cancel"
            type="button"
            onClick={onCancel}
          >
            取消
          </button>


          <button
            className="fridge-edit-confirm"
            type="button"
            disabled={!name.trim()}
            onClick={handleConfirm}
          >
            确认
          </button>

        </div>

      </main>

    </div>
  )
}


export default FridgeEdit