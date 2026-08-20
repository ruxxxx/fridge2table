import './BottomNav.css'

const navItems = [
  {
    id: 'home',
    label: '首页',
    icon: '/images/tabbar/tab-home.png',
    activeIcon: '/images/tabbar/tab-home-active.png',
  },
  {
    id: 'fridge',
    label: '冰箱',
    icon: '/images/tabbar/tab-fridge.png',
    activeIcon: '/images/tabbar/tab-fridge-active.png',
  },
  {
    id: 'recipes',
    label: '菜谱',
    icon: '/images/tabbar/tab-recipe.png',
    activeIcon: '/images/tabbar/tab-recipe-active.png',
  },
  {
    id: 'list',
    label: '清单',
    icon: '/images/tabbar/tab-list.png',
    activeIcon: '/images/tabbar/tab-list-active.png',
  },
]

function BottomNav({ activePage, onNavigate }) {
  return (
    <nav className="bottom-navigation">
      {navItems.map((item) => {
        const isActive = activePage === item.id

        return (
          <button
            key={item.id}
            className={`bottom-navigation-item ${
              isActive ? 'active' : ''
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <img
              src={isActive ? item.activeIcon : item.icon}
              alt=""
            />

            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default BottomNav