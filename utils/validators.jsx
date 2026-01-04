import { parsePhoneNumberWithError } from "libphonenumber-js";
import * as Yup from "yup";
// Validation Schemas

export const loginSchema = Yup.object({
  emailLogin: Yup.string()
    .email("Enter a valid email")
    .required("Email is required"),
  passwordLogin: Yup.string()
    .required("Password is required")
    .matches(/^\S+$/, "Password must not contain spaces")
    .matches(/[A-Za-z]/, "Password must contain at least one letter")
    .matches(/\d/, "Password must contain at least one number")
    .matches(/[^A-Za-z0-9]/, "Password must contain at least one symbol")
    .min(12, "Password must be at least 12 characters")
    .matches(/[^A-Za-z0-9]{1}/, "Password must contain only one symbol"),
});

export const passwordRules = [
  {
    label: "Must not contain spaces",
    test: (pwd) => /^\S+$/.test(pwd),
  },
  {
    label: "Must contain at least one letter",
    test: (pwd) => /[A-Za-z]/.test(pwd),
  },
  {
    label: "Must contain at least one number",
    test: (pwd) => /\d/.test(pwd),
  },
  {
    label: "Must contain at least one symbol",
    test: (pwd) => /[^A-Za-z0-9\s]/.test(pwd),
  },
  {
    label: "Must be at least 12 characters",
    test: (pwd) => pwd.length >= 12,
  },
  {
    label: "Must contain only one symbol",
    test: (pwd) => (pwd.match(/[^A-Za-z0-9\s]/g) || []).length === 1,
  },
];

export const registerSchema = Yup.object({
  name: Yup.string()
    .required("Name is required")
    .matches(/^[A-Za-z\s.]+$/, "Only letter are allowed")
    .matches(/^[A-Za-z]/, "Name must start with a letter")
    .matches(/[A-Za-z]$/, "Name must not end with a dot or any symbols"),
  email: Yup.string()
    .required("Email is required")
    .matches(/^\S+$/, "Email should not contain empty space!")
    .email("Enter a valid email")
    .matches(
      /(.com)$/,
      "Email domain is invalid. Please use @gmail.com or @yahoo.com."
    ),
  password: Yup.string()
    .required("Password is required")
    .matches(/^\S+$/, "Password must not contain spaces")
    .matches(/[A-Za-z]/, "Password must contain at least one letter")
    .matches(/\d/, "Password must contain at least one number")
    .matches(/[^A-Za-z0-9]/, "Password must contain at least one symbol")
    .min(12, "Password must be at least 12 characters")
    .matches(/[^A-Za-z0-9]{1}/, "Password must contain only one symbol"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Confirm password is required"),
  role: Yup.string()
    .oneOf(["patient", "doctor"], "Please select a role")
    .required("Please select a role"),
  fee: Yup.string().when("role", ([role], schema) => {
    return role === "doctor"
      ? schema
          .test(
            "is-valid-number",
            "Invalid amount! Enter valid number",
            function (value) {
              if (!value) return false;
              const num = Number(value);
              return !isNaN(num);
            }
          )
          .test("is-positive", "Fee must be positive", function (value) {
            if (!value) return false;
            const num = Number(value);
            return num > 0;
          })
          .required("Consultation fee is required")
      : schema;
  }),
  phone: Yup.string()
    .test("is-valid-phone", "Enter a valid phone number", function (value) {
      if (!value) return false;
      try {
        const phoneNumber = parsePhoneNumberWithError(`+${value}`);
        return phoneNumber.isValid();
      } catch (error) {
        console.log(error.message);
        return false;
      }
    })
    .required("Phone number is required"),
  address: Yup.string().required("Address is required"),
  degree: Yup.string().when("role", ([role], schema) => {
    return role === "doctor"
      ? schema.required("Degree is required for doctors")
      : schema;
  }),
});
export const feedbackSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  message: Yup.string()
    .min(10, "Message must be at least 10 characters")
    .required("Message is required"),
});
