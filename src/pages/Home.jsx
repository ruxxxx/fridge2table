import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import recipes from '../data/recipes'

import {
  getDaysLeft,
  rankRecipes,
} from '../utils/recipeMatch'

import './Home.css'


/* =========================
   Greeting
========================= */

function getGreeting() {

  const hour =
    new Date().getHours()


  if (
    hour >= 5 &&
    hour < 11
  ) {
    return '早上好'
  }


  if (
    hour >= 11 &&
    hour < 14
  ) {
    return '中午好'
  }


  if (
    hour >= 14 &&
    hour < 18
  ) {
    return '下午好'
  }


  return '晚上好'
}



function Home({
  fridgeItems = [],
  onOpenRecipe,
  onNavigate,
}) {


  /* =========================
     Greeting
  ========================= */

  const [
    greeting,
    setGreeting,
  ] = useState(
    getGreeting()
  )


  useEffect(() => {

    const updateGreeting =
      () => {

        setGreeting(
          getGreeting()
        )
      }


    /*
      每分钟检查一次时间
    */

    const timer =
      setInterval(
        updateGreeting,
        60 * 1000
      )


    return () =>
      clearInterval(
        timer
      )

  }, [])



  /* =========================
     Fridge Status
  ========================= */

  const counts =
    fridgeItems.reduce(
      (
        result,
        item
      ) => {

        const daysLeft =
          getDaysLeft(
            item.expiryDate
          )


        if (
          daysLeft < 0
        ) {

          result.expired +=
            1
        }

        else if (
          daysLeft <= 4
        ) {

          result.expiring +=
            1
        }

        else {

          result.fresh +=
            1
        }


        return result
      },

      {
        expired: 0,
        expiring: 0,
        fresh: 0,
      }
    )



  const foodStatus = [

    {
      id: 'expired',
      number:
        counts.expired,
      label:
        '已过期',
    },

    {
      id: 'expiring',
      number:
        counts.expiring,
      label:
        '快过期',
    },

    {
      id: 'fresh',
      number:
        counts.fresh,
      label:
        '新鲜',
    },

  ]



  /* =========================
     Dinner Recommendation
  ========================= */

  const recommendedRecipe =
    useMemo(() => {


      /*
        冰箱完全为空：
        随机推荐
      */

      if (
        fridgeItems.length ===
        0
      ) {

        const randomIndex =
          Math.floor(
            Math.random() *
            recipes.length
          )


        return {

          ...recipes[
            randomIndex
          ],

          missing: 0,

          expiring: 0,

        }
      }



      /*
        冰箱有东西：
        按库存匹配推荐
      */

      const rankedRecipes =
        rankRecipes(
          recipes,
          fridgeItems
        )


      return rankedRecipes[0]

    }, [fridgeItems])



  return (

    <div className="app">

      <main className="home-page">


        {/* =====================
            Greeting
        ===================== */}

        <header className="greeting">

          <h1>
            {greeting}
          </h1>

          <p>
            看看今天有什么该先吃
          </p>

        </header>



        {/* =====================
            Food Status
        ===================== */}

        <section className="section status-section">

          <h2>
            食材状态
          </h2>


          <div className="status-card">

            <div className="status-grid">

              {foodStatus.map(
                (item) => (

                  <div
                    className={`status-item ${item.id}`}
                    key={
                      item.id
                    }
                  >

                    <span className="status-number">

                      {item.number}

                    </span>


                    <span className="status-label">

                      {item.label}

                    </span>

                  </div>

                )
              )}

            </div>


            <div className="status-divider" />


            <button
              className="fridge-button"

              onClick={() =>
                onNavigate?.(
                  'fridge'
                )
              }
            >

              查看我的冰箱

              <span className="arrow">
                →
              </span>

            </button>

          </div>

        </section>



        {/* =====================
            Dinner Recommendation
        ===================== */}

        {recommendedRecipe && (

          <section className="section recommendation-section">

            <h2>
              菜谱推荐
            </h2>


            <p className="recipe-title">

              {recommendedRecipe.name}

            </p>


            <article className="recipe-card">


              {/* Image */}

              <img
                className="recipe-image"

                src={
                  recommendedRecipe.image
                }

                alt={
                  recommendedRecipe.name
                }
              />



              {/* Meta */}

              <div className="recipe-meta">


                {/* Duration */}

                <div className="meta-item">

                  <div className="meta-icon">

                    <img
                      src="/images/icons/icon-duration.png"
                      alt=""
                    />

                  </div>


                  <div>

                    <span className="meta-label">
                      时长
                    </span>

<strong>
  {
    parseInt(
      recommendedRecipe
        .cooking_time
    )
  } 分钟
</strong>

                  </div>

                </div>



                {/* Difficulty */}

                <div className="meta-item">

                  <div className="meta-icon">

                    <img
                      src="/images/icons/icon-difficulty.png"
                      alt=""
                    />

                  </div>


                  <div>

                    <span className="meta-label">
                      难度
                    </span>

                    <strong>

                      {
                        recommendedRecipe
                          .difficulty
                      }

                    </strong>

                  </div>

                </div>



                {/* Expiring */}

                <div className="meta-item">

                  <div className="meta-icon">

                    <img
                      src="/images/icons/icon-veg.png"
                      alt=""
                    />

                  </div>


                  <div>

                    <span className="meta-label">
                      临期
                    </span>

                    <strong>

                      {
                        recommendedRecipe
                          .expiring
                      } 种

                    </strong>

                  </div>

                </div>

              </div>



              {/* Open Recipe */}

              <button
                className="recipe-button"

                onClick={() =>
                  onOpenRecipe?.(
                    recommendedRecipe
                  )
                }
              >

                查看做法

                <span className="arrow">
                  →
                </span>

              </button>

            </article>

          </section>

        )}

      </main>

    </div>
  )
}


export default Home