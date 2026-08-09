# Arazel Full Panel

پنل مدیریت Arazel با تم مشکی/قرمز، مدیریت Member و Rank، لاگ‌های TeamSpeak/Locker/Gang و اتصال خودکار TeamSpeak ServerQuery.

## اجرا

1. این پوشه را روی سیستم/سرور کپی کنید.
2. `.env.example` را به `.env` تغییر نام دهید.
3. داخل `.env` رمز واقعی ServerQuery را وارد کنید.
4. اجرا:

```bash
npm install
npm start
```

پنل:
`http://localhost:3000`

فرم درخواست عمومی:
`http://localhost:3000/request.html`

## TeamSpeak

تنظیمات پیش‌فرض:

- Host: `Tsww.ir`
- Voice Port: `6360`
- Query Port: `6360`
- Query User: `Serversdmin1`

رمز در `.env` قرار می‌گیرد و داخل Git/کد ذخیره نمی‌شود.

اتصال Query رخدادهای Join/Leave/Move/Text Message را دریافت و در TeamSpeak Log ذخیره می‌کند.

> اگر ServerQuery واقعاً روی پورت 6360 فعال نباشد، Voice Port و Query Port باید جدا تنظیم شوند.
