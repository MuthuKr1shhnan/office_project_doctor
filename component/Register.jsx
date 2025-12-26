"use client";
import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import Image from "next/image";
import { EyeCloseIcon, EyeOpenIcon } from "@/assets/icon";
import { AsYouType } from "libphonenumber-js";
import Btn from "./Btn";
export const Register = ({
  onRegisterSuccess,
  registerSchema,
  passwordRules,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [list, setList] = useState(false);

  return (
    <Formik
      initialValues={{
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "doctor",
        fee: "",
        phone: "",
        address: "",
        degree: "",
      }}
      validationSchema={registerSchema}
      validateOnChange
      validateOnBlur
      onSubmit={onRegisterSuccess}
    >
      {({
        isSubmitting,
        errors,
        touched,
        values,
        setFieldValue,
        isValid,
        dirty,
      }) => (
        <Form className='space-y-4'>
          {/* Name */}
          <div>
            <label className='block text-xs text-gray-600 mb-1'>
              Full name *
            </label>
            <Field
              type='text'
              name='name'
              autoComplete='name'
              value={values.name}
              className={`w-full text-sm bg-white border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name && touched.name
                  ? "border-red-300"
                  : "border-gray-200"
              }`}
              placeholder='Your full name'
            />
            <ErrorMessage
              name='name'
              component='div'
              className='text-xs text-red-600 mt-1'
            />
          </div>

          {/* Degree (only for doctors) */}
          {values.role === "doctor" && (
            <div>
              <label className='block text-xs text-gray-600 mb-1'>
                Degree *
              </label>
              <Field
                type='text'
                name='degree'
                autoComplete='off'
                value={values.degree}
                className={`w-full text-sm bg-white border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.degree && touched.degree
                    ? "border-red-300"
                    : "border-gray-200"
                }`}
                placeholder='MBBS, MD, etc.'
              />
              <ErrorMessage
                name='degree'
                component='div'
                className='text-xs text-red-600 mt-1'
              />
            </div>
          )}
          {/* Consultation Fee (only for doctors) */}
          {values.role === "doctor" && (
            <div>
              <label className='block text-xs text-gray-600 mb-1'>
                Consultation Fee &#8377; *
              </label>
              <Field
                type='text'
                name='fee'
                autoComplete='off'
                value={values.fee}
                className={`w-full text-sm bg-white border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.fee && touched.fee
                    ? "border-red-300"
                    : "border-gray-200"
                }`}
                placeholder='500'
              />
              <ErrorMessage
                name='fee'
                component='div'
                className='text-xs text-red-600 mt-1'
              />
            </div>
          )}
          {/* Email */}
          <div>
            <label className='block text-xs text-gray-600 mb-1'>Email *</label>
            <Field
              type='email'
              name='email'
              autoComplete='email'
              value={values.email}
              className={`w-full text-sm bg-white border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email && touched.email
                  ? "border-red-300"
                  : "border-gray-200"
              }`}
              placeholder='you@example.com'
            />
            <ErrorMessage
              name='email'
              component='div'
              className='text-xs text-red-600 mt-1'
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className='block text-xs text-gray-600 mb-1'>
              Phone Number *
            </label>

            <PhoneInput
              country={"us"}
              value={values.phone}
              onChange={(phone, country) => {
                const formatter = new AsYouType(country.countryCode).input(
                  phone
                ); // pass country code here

                setFieldValue("phone", formatter || "");
              }}
              inputProps={{
                name: "phone",
                required: true,
                autoComplete: "tel",
                className: `!w-full !h-10 !pl-12 !pr-3 !py-2 !text-gray-700 !border !border-gray-300 !rounded-md focus:!outline-none focus:!ring-2 focus:!ring-blue-500 focus:!border-blue-500  ${
                  errors.phone && touched.phone
                    ? "!border-red-300"
                    : "!border-gray-200"
                }`,
              }}
              containerClass='!w-full'
              buttonClass={`!absolute !top-0 !bottom-0 !left-0 !w-12 !h-full !flex !items-center !justify-center !bg-gray-50 hover:!bg-gray-100 !border-r !border-gray-300 !rounded-l-md ${
                errors.phone && touched.phone
                  ? "!border-red-300"
                  : "!border-gray-200"
              }`}
              dropdownClass='!absolute !left-0 !mt-1 !w-64 !bg-white !shadow-lg !rounded-md !max-h-60 !overflow-y-auto !z-50 !border !border-gray-200'
              searchClass='!w-full !border !border-gray-300 !px-3 !py-2 !rounded-md focus:!outline-none focus:!ring-2 focus:!ring-blue-500 focus:!border-blue-500 !m-2'
            />

            <ErrorMessage
              name='phone'
              component='div'
              className='text-xs text-red-600 mt-1'
            />
          </div>

          {/* Address */}
          <div>
            <label className='block text-xs text-gray-600 mb-1'>
              Address *
            </label>
            <Field
              as='textarea'
              name='address'
              autoComplete='street-address'
              value={values.address}
              className={`w-full text-sm bg-white border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                errors.address && touched.address
                  ? "border-red-300"
                  : "border-gray-200"
              }`}
              placeholder='Your complete address'
              rows='2'
            />
            <ErrorMessage
              name='address'
              component='div'
              className='text-xs text-red-600 mt-1'
            />
          </div>

          {/* Password */}
          <div>
            <label className='block text-xs text-gray-600 mb-1'>
              Password *
            </label>
            <div className='flex gap-1 w-full'>
              <div
                className={`flex items-center focus-within:ring-2 focus-within:ring-blue-500 w-full border rounded-lg bg-white px-1 py-1 ${
                  errors.password && touched.password
                    ? "border-red-300"
                    : "border-gray-200"
                }`}
              >
                <Field
                  type={showPassword ? "text" : "password"}
                  name='password'
                  autoComplete='new-password'
                  onFocus={() => setList(true)}
                  onBlur={() => setList(false)}
                  value={"User0000000$"}
                  className='w-full text-sm rounded-lg px-3 outline-none '
                  placeholder='Choose a password'
                />
                <button
                  className='p-1'
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  type='button'
                >
                  {showPassword ? (
                    <Image
                      alt='eye-close'
                      width={24}
                      height={24}
                      src={EyeCloseIcon}
                      style={{
                        filter: "grayscale(1) brightness(0.7) opacity(0.6)",
                      }}
                    />
                  ) : (
                    <Image
                      alt='eye-open'
                      width={24}
                      height={24}
                      src={EyeOpenIcon}
                      style={{
                        filter: "grayscale(1) brightness(0.7) opacity(0.6)",
                      }}
                    />
                  )}
                </button>
              </div>
            </div>

            <div className={`mt-2 space-y-1 ${!list ? "hidden" : "block"}`}>
              {passwordRules.map((rule, idx) => {
                const passed = rule.test(values.password || "");
                return (
                  <div key={idx} className='flex items-center text-sm '>
                    <span className='mr-2'>{passed ? "✅" : "❌"}</span>
                    <span
                      className={passed ? "text-green-600" : "text-red-600"}
                    >
                      {rule.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className='block text-xs text-gray-600 mb-1'>
              Confirm password *
            </label>
            <Field
              type='password'
              name='confirmPassword'
              autoComplete='new-password'
              value={"User0000000$"}
              className={`w-full text-sm bg-white border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.confirmPassword && touched.confirmPassword
                  ? "border-red-300"
                  : "border-gray-200"
              }`}
              placeholder='Repeat your password'
            />
            <ErrorMessage
              name='confirmPassword'
              component='div'
              className='text-xs text-red-600 mt-1'
            />
          </div>

          <Btn
            variant='primary'
            type='submit'
            className={`w-full py-3 mt-6 ${
              !isValid || !dirty || isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            disabled={!isValid || !dirty || isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </Btn>
        </Form>
      )}
    </Formik>
  );
};
