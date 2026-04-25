import React from "react";
import Footer from "./Footer";
import MovieHeader from "./MovieHeader";

const LayoutMovie = ({ children, activeTab = "movies" }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <MovieHeader activeTab={activeTab} />
      <main className="flex-2">{children}</main>
      <Footer />
    </div>
  );
};

export default LayoutMovie;
