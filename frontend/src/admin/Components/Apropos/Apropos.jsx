import React from 'react';
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import './Apropos.css'; 

const AboutPage = () => {
  return (
    <div className="pageContainerpop">
      <Sidebar />
      <div className="contentWrapperpop">
        <Navbar />
        <div className="mainContentpop">
          <header className="headerpop">
            <h1 className="titlepop">About Arab Soft</h1>
            <p className="subtitlepop">Innovative Solutions for Your Business Needs</p>
          </header>

          <section className="sectionpop">
            <h2 className="sectionTitlepop">Our Vision</h2>
            <p className="sectionTextpop">
              We aim to be the leading provider of technology-driven solutions in the Middle East. Our goal is to help businesses grow with state-of-the-art software solutions tailored to their needs.
            </p>
          </section>

          <section className="sectionpop">
            <h2 className="sectionTitlepop">Our Values</h2>
            <ul className="listpop">
              <li className="listItempop"><strong>Innovation</strong>: Continuously pushing the boundaries of technology to deliver effective solutions.</li>
              <li className="listItempop"><strong>Quality</strong>: Delivering top-notch products that meet the exact needs of our clients.</li>
              <li className="listItempop"><strong>Reliability</strong>: Ensuring our solutions are robust, secure, and stable.</li>
              <li className="listItempop"><strong>Collaboration</strong>: We value teamwork and partnership with our clients.</li>
              <li className="listItempop"><strong>Customer Service</strong>: Providing exceptional after-sales support to ensure customer satisfaction.</li>
            </ul>
          </section>

          <section className="sectionpop">
            <h2 className="sectionTitlepop">Our Services</h2>
            <ul className="listpop">
              <li className="listItempop"><strong>Custom Software Development</strong>: Tailored software solutions for your business needs.</li>
              <li className="listItempop"><strong>Web & Mobile Development</strong>: High-performance websites and mobile applications for seamless user experiences.</li>
              <li className="listItempop"><strong>ERP & CRM Solutions</strong>: Personalized systems to improve resource management and productivity.</li>
              <li className="listItempop"><strong>System Integration</strong>: Integrating various IT systems to ensure better synergy.</li>
              <li className="listItempop"><strong>Technology Consulting</strong>: Expert advice to guide your technology and digital transformation efforts.</li>
              <li className="listItempop"><strong>Technical Support & Maintenance</strong>: Ongoing support to ensure smooth operation of your IT systems.</li>
            </ul>
          </section>

         
        </div>
      </div>
    </div>
  );
};

export default AboutPage;