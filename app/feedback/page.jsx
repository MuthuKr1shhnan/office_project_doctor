"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import emailjs from "emailjs-com";
import Btn from "@/component/Btn";
import { toast } from "sonner";
import { feedbackSchema } from "../../utils/validators";

export default function page() {
  return (
    <section
      className='flex items-center justify-center px-4'
      style={{ height: "calc(100vh)" }}
    >
      <Formik
        initialValues={{
          email: "",
          message: "",
        }}
        validationSchema={feedbackSchema}
        validateOnChange
        validateOnBlur
        onSubmit={async (values, { resetForm, setSubmitting }) => {
          try {
            await emailjs.send(
              process.env.NEXT_PUBLIC_SERVICE_ID,
              process.env.NEXT_PUBLIC_TEMPLATE_ID,
              values,
              process.env.NEXT_PUBLIC_KEY
            );

            toast.success("Feedback sent successfully");
            resetForm();
          } catch (error) {
            toast.error("Something went wrong. Try again later.");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, isValid, dirty }) => (
          <Form className='w-full p-5 md:p-0 md:max-w-md text-black space-y-6'>
            <h2 className='text-3xl font-semibold mb-6'>Give Your Feedback</h2>

            {/* Email */}
            <div>
              <label className='block text-xs text-gray-800 mb-1'>
                Email *
              </label>
              <Field
                type='email'
                name='email'
                autoComplete='email'
                placeholder='you@example.com'
                className='w-full bg-transparent border-b border-gray-600/55 py-2 focus:outline-none'
              />
              <ErrorMessage
                name='email'
                component='div'
                className='text-xs text-red-600 mt-1'
              />
            </div>

            {/* Message */}
            <div>
              <label className='block text-xs text-gray-800 mb-1'>
                Message *
              </label>
              <Field
                as='textarea'
                name='message'
                rows={4}
                placeholder='Write your feedback...'
                className='w-full bg-transparent border-b border-gray-600/55 py-2 resize-none focus:outline-none'
              />
              <ErrorMessage
                name='message'
                component='div'
                className='text-xs text-red-600 mt-1'
              />
            </div>

            <Btn
              type='submit'
              variant='primary'
              className={`w-full py-3 ${
                !isValid || !dirty || isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={!isValid || !dirty || isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Feedback"}
            </Btn>
          </Form>
        )}
      </Formik>
    </section>
  );
}
