import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import ingredients from '../data/ingredients'

import './FridgeAdd.css'


/* =========================
   Today
========================= */

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


/* =========================
   Parse Quantity

   数量允许为空
========================= */

function parseQuantity(
  text,
  defaultUnit = '个'
) {

  const value =
    text.trim()


  if (!value) {

    return {
      quantity: null,
      unit: defaultUnit,
    }
  }


  const match =
    value.match(
      /^(\d+(?:\.\d+)?)\s*(.*)$/
    )


  if (!match) {

    return {
      quantity: null,
      unit: defaultUnit,
    }
  }


  return {

    quantity:
      Number(
        match[1]
      ),

    unit:
      match[2].trim() ||
      defaultUnit,

  }
}


/* =========================
   Component
========================= */

function FridgeAdd({

  presetIngredientId = null,

  onAdd,

  onCancel,

  onOpenBrowse,

  onOpenScan,

}) {


  /* =========================
     Preset Ingredient

     例如：
     003 = 鸡蛋
  ========================= */

  const presetIngredient =
    useMemo(
      () => {

        if (
          !presetIngredientId
        ) {
          return null
        }


        return (
          ingredients.find(
            (item) =>
              item.ingredient_id ===
              presetIngredientId
          ) || null
        )
      },
      [
        presetIngredientId,
      ]
    )


  /* =========================
     Name
  ========================= */

  const [
    name,
    setName,
  ] = useState(
    ''
  )


  /* =========================
     Quantity
  ========================= */

  const [
    quantityText,
    setQuantityText,
  ] = useState(
    ''
  )


  /* =========================
     Purchase Date
  ========================= */

  const [
    purchaseDate,
    setPurchaseDate,
  ] = useState(
    getTodayString()
  )


  /* =========================
     Shelf Life
  ========================= */

  const [
    shelfLife,
    setShelfLife,
  ] = useState(
    7
  )


  /* =========================
     Apply Shortcut Preset

     点击鸡蛋 / 牛奶 / 土豆后
     自动填入对应资料
  ========================= */

  useEffect(
    () => {

      if (
        presetIngredient
      ) {

        setName(
          presetIngredient.name
        )


        setShelfLife(
          presetIngredient
            .default_shelf_life
        )


        setQuantityText(
          ''
        )


        setPurchaseDate(
          getTodayString()
        )

      } else {

        setName(
          ''
        )


        setShelfLife(
          7
        )


        setQuantityText(
          ''
        )


        setPurchaseDate(
          getTodayString()
        )
      }

    },
    [
      presetIngredient,
    ]
  )


  /* =========================
     Name Change

     普通快速添加时，
     如果名称对应正式食材，
     自动读取后台保质期。
  ========================= */

  const handleNameChange =
    (value) => {


      setName(
        value
      )


      const cleanValue =
        value.trim()


      const matched =
        ingredients.find(
          (item) =>
            item.name ===
            cleanValue ||
            item.keywords?.includes(
              cleanValue
            )
        )


      if (
        matched
      ) {

        setShelfLife(
          matched
            .default_shelf_life
        )
      }
    }


  /* =========================
     Submit
  ========================= */

  const handleSubmit =
    () => {


      const cleanName =
        name.trim()


      if (
        !cleanName
      ) {
        return
      }


      /* =====================
         Find Ingredient
      ===================== */

      const ingredientInfo =
        presetIngredient ||
        ingredients.find(
          (item) =>
            item.name ===
            cleanName ||
            item.keywords?.includes(
              cleanName
            )
        )


      /* =====================
         Default Unit
      ===================== */

      const defaultUnit =
        ingredientInfo
          ?.default_unit ||
        '个'


      /* =====================
         Quantity
      ===================== */

      const {
        quantity,
        unit,
      } =
        parseQuantity(
          quantityText,
          defaultUnit
        )


      /* =====================
         Added Date
      ===================== */

      const addedDate =
        new Date(
          `${purchaseDate}T00:00:00`
        )


      /* =====================
         Expiry Date
      ===================== */

      const expiryDate =
        new Date(
          addedDate
        )


      expiryDate.setDate(

        expiryDate.getDate() +

        Number(
          shelfLife ||
          0
        )

      )


      /* =====================
         Category
      ===================== */

      const category =
        ingredientInfo
          ?.category ===
        '蔬菜'
          ? '果蔬'
          : (
              ingredientInfo
                ?.category ||
              '其他'
            )


      /* =====================
         Add To Fridge
      ===================== */

      onAdd({

        ingredientId:
          ingredientInfo
            ?.ingredient_id ||
          null,

        name:
          ingredientInfo
            ?.name ||
          cleanName,

        category,

        quantity,

        unit,

        image:
          ingredientInfo
            ?.image ||
          '',

        addedDate,

        expiryDate,

      })
    }


  /* =========================
     Render
  ========================= */

  return (

    <div className="fridge-add-app">


      <main className="fridge-add-page">


        {/* =====================
            Header
        ===================== */}

        <header className="fridge-add-header">

          <h1>
            添加食材
          </h1>

          <p>
            选择添加食材的方式
          </p>

        </header>


        {/* =====================
            Methods
        ===================== */}

        <section className="fridge-add-methods">


          {/* Receipt Scan */}

          <button

            className="fridge-method"

            type="button"

            onClick={
              onOpenScan
            }

          >

            <img

              src="/images/icons/icon-scan.png"

              alt=""

            />


            <span>
              小票识别
            </span>

          </button>


          {/* Browse Add */}

          <button

            className="fridge-method"

            type="button"

            onClick={
              onOpenBrowse
            }

          >

            <img

              src="/images/icons/icon-search.png"

              alt=""

            />


            <span>
              浏览添加
            </span>

          </button>


          {/* Quick Add */}

          <button

            className="fridge-method active"

            type="button"

          >

            <img

              src="/images/icons/icon-writing.png"

              alt=""

            />


            <span>
              快速添加
            </span>

          </button>

        </section>


        {/* =====================
            Form
        ===================== */}

        <section className="fridge-add-card">


          <h2>
            食材信息
          </h2>


          {/* =====================
              Name
          ===================== */}

          <label className="fridge-add-field">

            <span>
              食材名称
            </span>


            <input

              type="text"

              value={
                name
              }

              placeholder="例：鸡蛋"

              readOnly={
                Boolean(
                  presetIngredient
                )
              }

              onChange={(
                event
              ) =>

                handleNameChange(
                  event.target
                    .value
                )

              }

            />

          </label>


          {/* =====================
              Quantity
          ===================== */}

          <label className="fridge-add-field">

            <span>
              数量
            </span>


            <input

              type="text"

              value={
                quantityText
              }

              placeholder={
                presetIngredient
                  ? `例：2${presetIngredient.default_unit}`
                  : '例：500g'
              }

              onChange={(
                event
              ) =>

                setQuantityText(
                  event.target
                    .value
                )

              }

            />

          </label>


          {/* =====================
              Purchase Date
          ===================== */}

          <label className="fridge-add-field">

            <span>
              购买日期
            </span>


            <input

              type="date"

              value={
                purchaseDate
              }

              onChange={(
                event
              ) =>

                setPurchaseDate(
                  event.target
                    .value
                )

              }

            />

          </label>


          {/* =====================
              Shelf Life
          ===================== */}

          <label className="fridge-add-field">

            <span>
              保质期 (天)
            </span>


            <input

              type="number"

              min="0"

              value={
                shelfLife
              }

              onChange={(
                event
              ) =>

                setShelfLife(
                  event.target
                    .value
                )

              }

            />

          </label>

        </section>


        {/* =====================
            Actions
        ===================== */}

        <div className="fridge-add-actions">


          <button

            className="fridge-add-cancel"

            type="button"

            onClick={
              onCancel
            }

          >
            取消加入
          </button>


          <button

            className="fridge-add-confirm"

            type="button"

            disabled={
              !name.trim()
            }

            onClick={
              handleSubmit
            }

          >
            加入冰箱
          </button>

        </div>

      </main>

    </div>

  )
}


export default FridgeAdd