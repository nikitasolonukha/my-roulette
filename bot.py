from aiogram import Bot, Dispatcher, types
from aiogram.types import KeyboardButton, WebAppInfo, ReplyKeyboardMarkup
from aiogram.filters import Command

# Замените на ваш токен бота
bot = Bot(token="8388115069:AAEdPpA0j9CG_2yE5AfmohwMq6Vl5El1zvw")
dp = Dispatcher()

# Кнопка для открытия Mini App
def get_roulette_keyboard():
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(
            text="🎰 Крутить колесо",
            web_app=WebAppInfo(url="https://t.me/ITL_otzivi_bot/itlotzivi")
        )]],
        resize_keyboard=True
    )

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer(
        "🎰 Добро пожаловать!\n\nНажмите кнопку ниже:",
        reply_markup=get_roulette_keyboard()
    )

# Запуск бота
async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
