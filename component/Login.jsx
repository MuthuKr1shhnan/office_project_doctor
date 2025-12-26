"use client";
import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import Image from "next/image";
import { EyeCloseIcon, EyeOpenIcon } from "../assets/icon";
import Btn from "./Btn";
export const Login = ({ onLoginSuccess, onGoogleLogin, loginSchema }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Formik
      initialValues={{ emailLogin: "", passwordLogin: "" }}
      validationSchema={loginSchema}
      validateOnChange
      validateOnBlur
      onSubmit={onLoginSuccess}
    >
      {({ isSubmitting }) => (
        <Form className='space-y-4'>
          <div>
            <label className='block text-xs text-gray-600 mb-1'>Email</label>
            <div className='flex items-center w-full border rounded-lg bg-white px-3 py-2'>
              <Field
                type='email'
                name='emailLogin'
                className='flex-1 text-sm p-1 bg-transparent outline-none'
                placeholder='you@example.com'
                autoComplete='username'
              />
            </div>
            <ErrorMessage
              name='emailLogin'
              component='div'
              className='text-xs text-red-600 mt-1'
            />
          </div>

          <div>
            <label className='block text-xs text-gray-600 mb-1'>Password</label>
            <div className='flex items-center w-full border rounded-lg bg-white px-3 py-1'>
              <Field
                type={showPassword ? "text" : "password"}
                name='passwordLogin'
                className='flex-1 text-sm bg-transparent outline-none'
                placeholder='$Password123'
                autoComplete='current-password'
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='p-1'
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
            <ErrorMessage
              name='passwordLogin'
              component='div'
              className='text-xs text-red-600 mt-1'
            />
          </div>

          <Btn
            type='submit'
            className='w-full py-3 mt-2'
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Btn>
          <p className='text-gray-400 w-full text-center'>Or</p>
          <Btn type='button' onClick={onGoogleLogin} className='w-full py-3'>
            Sign in with Google
          </Btn>
        </Form>
      )}
    </Formik>
  );
};
