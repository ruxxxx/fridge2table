import { useState } from 'react'

import ingredients from '../data/ingredients'

import {
  getDefaultUnit,
  parseQuantityText,
} from '../utils/shopping'

import './ShoppingAdd.css'


function ShoppingAdd({
  onAddShoppingItem,
  onBack,
}) {

  const [name, setName] =
    useState('')

  const [quantityText, setQuantityText] =
    useState('')

  const [note, setNote] =
    useState('')


  const handleSubmit = () => {

    const cleanName =
      name.trim()

    if (!cleanName) {
      return
    }


    /* 看是不是已有食材库中的食材 */

    const knownIngredient =
      ingredients.find(
        (ingredient) =>
          ingredient.name === cleanName
      )


    const ingredientId =
      knownIngredient
        ? knownIngredient.id
        : null


    const fallbackUnit =
      ingredientId
        ? getDefaultUnit(
            ingredientId
          )
        : '个'


    const {
      quantity,
      unit,
    } = parseQuantityText(
      quantityText || '1',
      fallbackUnit
    )


    onAddShoppingItem({
      ingredientId,
      name: cleanName,
      quantity,
      unit,
      note: note.trim() || null,
      source: null,
    })


    onBack()
  }


  return (
    <div className="shopping-add-app">

      <main className="shopping-add-page">


        {/* Header */}

        <header className="shopping-add-header">

          <h1>
            添加采购项
          </h1>

          <p>
            选择要加入采购清单的食材
          </p>

        </header>



        {/* Form */}

        <section className="shopping-add-card">

          <h2>
            食材信息
          </h2>


          {/* Name */}

          <label className="shopping-form-group">

            <span>
              食材名称
            </span>

            <input
              type="text"
              value={name}
              placeholder="例：鸡蛋"

              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
            />

          </label>


          {/* Quantity */}

          <label className="shopping-form-group">

            <span>
              数量
            </span>

            <input
              type="text"
              value={quantityText}
              placeholder="例：2个 / 500g / 1盒"

              onChange={(event) =>
                setQuantityText(
                  event.target.value
                )
              }
            />

          </label>


          {/* Note */}

          <label className="shopping-form-group">

            <span>
              备注
            </span>

            <input
              type="text"
              value={note}
              placeholder="例：用来制作番茄炒蛋"

              onChange={(event) =>
                setNote(
                  event.target.value
                )
              }
            />

          </label>

        </section>



        {/* Buttons */}

        <div className="shopping-add-actions">

          <button
            className="shopping-add-cancel"
            onClick={onBack}
          >
            取消加入
          </button>


          <button
            className="shopping-add-confirm"
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            加入清单
          </button>

        </div>

      </main>

    </div>
  )
}


export default ShoppingAdd