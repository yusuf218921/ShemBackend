const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const app = express();
const port = 5000;
app.use(cors());
// MongoDB bağlantı URL'si
const mongoUrl =
  "mongodb+srv://yusufsonmez951:218921aa@cluster0.3v0uzsz.mongodb.net/";
const dbName = "ShemDB";

// Express.js middleware
app.use(express.json());

const connectToDatabase = async () => {
  const client = await MongoClient.connect(mongoUrl);
  return client.db(dbName);
};

// Kullanıcı ekleme fonksiyonu
const addUser = async (db, newUser) => {
  // "users" koleksiyonuna kullanıcıyı ekle
  const result = await db.collection("users").insertOne(newUser);
  return result;
};

// E-posta adresi kontrolü
const isEmailExists = async (db, email) => {
  const existingUser = await db.collection("users").findOne({ email });
  return existingUser !== null;
};

const comparePassword = (password, storedPassword) => {
  return password === storedPassword;
};

app.post("/register", async (req, res) => {
  try {
    const db = await connectToDatabase();

    // Gelen kullanıcı bilgilerini al
    const newUser = req.body;

    // E-posta adresi kontrolü
    const emailExists = await isEmailExists(db, newUser.email);
    if (emailExists) {
      return res
        .status(400)
        .json({ message: "Bu e-posta adresi zaten kayıtlı." });
    }

    // Kullanıcıyı ekle
    const result = await addUser(db, newUser);

    // Bağlantıyı kapat
    db.client.close();

    res.json({
      message: "User added successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const db = await connectToDatabase();

    const { email, password } = req.body;

    // Kullanıcıyı e-posta adresine göre bul
    const user = await db.collection("users").findOne({ email });

    // Kullanıcı bulunamazsa hata mesajı gönder
    if (!user) {
      return res.status(400).json({ message: "E-posta veya şifre hatalı." });
    }

    // Şifre kontrolü
    const passwordMatch = await comparePassword(password, user.password);

    // Şifre uyuşmazsa hata mesajı gönder
    if (!passwordMatch) {
      return res.status(400).json({ message: "E-posta veya şifre hatalı." });
    }

    // Başarılı giriş mesajı gönder ve kullanıcının tüm bilgilerini döndür
    res.json({ message: "Başarıyla giriş yapıldı", user });

    db.client.close();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// API Endpoint'i
app.get("/users", async (req, res) => {
  try {
    // MongoDB'ye bağlan
    const client = await MongoClient.connect(mongoUrl);
    const db = client.db(dbName);

    // "kisiler" koleksiyonundan tüm belgeleri çek
    const kisiler = await db.collection("users").find().toArray();

    // Bağlantıyı kapat
    client.close();

    res.json(kisiler);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Server'ı dinle
app.listen(port, () => {
  console.log(`Server ${port} portunda çalışıyor`);
});
