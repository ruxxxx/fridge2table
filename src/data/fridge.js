const getDateFromToday = (offset) => {
  const date = new Date()

  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + offset)

  return date
}


const initialFridgeItems = [
  {
    id: 'f001',
    ingredientId: '001',
    name: '土豆',
    category: '果蔬',
    quantity: 3,
    unit: '个',
    image: '/images/ingredients/ingredient-potato.png',
    addedDate: getDateFromToday(-3),
    expiryDate: getDateFromToday(4),
  },

  {
    id: 'f002',
    ingredientId: '002',
    name: '番茄',
    category: '果蔬',
    quantity: 4,
    unit: '个',
    image: '/images/ingredients/ingredient-tomato.png',
    addedDate: getDateFromToday(-2),
    expiryDate: getDateFromToday(4),
  },

  {
    id: 'f003',
    ingredientId: '003',
    name: '鸡蛋',
    category: '乳制品',
    quantity: 6,
    unit: '个',
    image: '/images/ingredients/ingredient-egg.png',
    addedDate: getDateFromToday(-3),
    expiryDate: getDateFromToday(2),
  },

  {
    id: 'f004',
    ingredientId: '004',
    name: '牛奶',
    category: '乳制品',
    quantity: 1,
    unit: '瓶',
    image: '/images/ingredients/ingredient-milk.png',
    addedDate: getDateFromToday(-2),
    expiryDate: getDateFromToday(3),
  },

  {
    id: 'f005',
    ingredientId: '005',
    name: '茄子',
    category: '果蔬',
    quantity: 2,
    unit: '个',
    image: '/images/ingredients/ingredient-eggplant.png',
    addedDate: getDateFromToday(-1),
    expiryDate: getDateFromToday(8),
  },

  {
    id: 'f006',
    ingredientId: '006',
    name: '青椒',
    category: '果蔬',
    quantity: 3,
    unit: '个',
    image: '/images/ingredients/ingredient-green-pepper.png',
    addedDate: getDateFromToday(0),
    expiryDate: getDateFromToday(10),
  },

  {
    id: 'f007',
    ingredientId: '007',
    name: '胡萝卜',
    category: '果蔬',
    quantity: 2,
    unit: '根',
    image: '/images/ingredients/ingredient-carrot.png',
    addedDate: getDateFromToday(-1),
    expiryDate: getDateFromToday(7),
  },

  {
    id: 'f008',
    ingredientId: '008',
    name: '鸡肉',
    category: '肉类',
    quantity: 300,
    unit: 'g',
    image: '/images/ingredients/ingredient-chicken.png',
    addedDate: getDateFromToday(-4),
    expiryDate: getDateFromToday(-1),
  },

  {
    id: 'f009',
    ingredientId: '009',
    name: '牛肉',
    category: '肉类',
    quantity: 300,
    unit: 'g',
    image: '/images/ingredients/ingredient-beef.png',
    addedDate: getDateFromToday(-5),
    expiryDate: getDateFromToday(-2),
  },

  {
    id: 'f010',
    ingredientId: '010',
    name: '洋葱',
    category: '果蔬',
    quantity: 2,
    unit: '个',
    image: '/images/ingredients/ingredient-onion.png',
    addedDate: getDateFromToday(0),
    expiryDate: getDateFromToday(12),
  },
]


export default initialFridgeItems