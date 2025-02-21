const UserInfo = require("../models/userInfoModel");

exports.registerUser = async (req, res) => {
    const { user_name, email, password, role } = req.body;
    try {
      const userExists = await UserInfo.findOne({ email });
      if (userExists) return res.status(400).json({ message: "User already exists" });
      const newUser = await UserInfo.create({ user_name, email, password, role });
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
    const users = await UserInfo.find();
    res.status(200).json(users);
    } catch (error) {
    res.status(500).json({ message: error.message });
    }   
};