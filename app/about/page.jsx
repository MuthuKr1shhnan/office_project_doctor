import React from "react";

const AboutPage = () => {
  return (
    <main
      className=' px-6 py-12 flex  items-center justify-center'
      style={{ height: "calc(100dvh)" }}
    >
      <div className='max-w-3xl w-full space-y-10'>
        {/* Title */}
        <header>
          <h1 className='text-3xl font-semibold text-gray-900'>
            About This App
          </h1>
          <p className='mt-2 text-gray-600'>
            Learn why this app was built and who is behind it.
          </p>
        </header>

        {/* Why this app */}
        <section className='space-y-3'>
          <h2 className='text-xl font-medium text-gray-900'>Why This App?</h2>
          <p className='text-gray-700 leading-relaxed'>
            This app is built with the mission of simplifying doctor–patient
            connections, making medical counseling more accessible and
            efficient. By providing a secure and user-friendly platform, it
            bridges the gap between patients seeking guidance and doctors
            offering expertise. The focus is on reducing complexity, ensuring
            smooth communication, and delivering a clean, reliable experience so
            that consultations can happen quickly and without friction. In
            essence, it empowers patients to get the help they need while giving
            doctors a streamlined way to provide care.
          </p>
        </section>

        {/* About you */}
        <section className='space-y-3'>
          <h2 className='text-xl font-medium text-gray-900'>
            About the Creator
          </h2>
          <p className='text-gray-700 leading-relaxed'>
            Hi, I’m <span className='font-medium'>Muthu Krishnan</span>, a
            developer passionate about building practical web applications. I
            enjoy working with modern technologies and creating solutions that
            are both functional and well-designed.
          </p>

          {/* Contact Info */}
          <div className='space-y-1 text-gray-700'>
            <p>
              📱 <span className='font-medium'>Mobile:</span> +91 98765 43210
            </p>
            <p>
              📧 <span className='font-medium'>Email:</span>{" "}
              muthukrishnan@gmail.com
            </p>
          </div>
        </section>

        {/* Optional footer note */}
        <footer className='pt-6 border-t text-sm text-gray-500'>
          This app is continuously improving based on learning and feedback.
        </footer>
      </div>
    </main>
  );
};

export default AboutPage;
