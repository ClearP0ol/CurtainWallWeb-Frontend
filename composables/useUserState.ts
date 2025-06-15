import { reactive } from 'vue'

export const userState = reactive({
  name: localStorage.getItem("email") || "",
  email: "admin@tongji.edu.cn",
  username: "Admin",
  avatar: "",
  bio: "",
  password_current: "",
  password_new: "",
})
