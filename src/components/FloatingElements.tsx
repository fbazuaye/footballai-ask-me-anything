const FloatingElements = () => {
  return (
    <>
      {/* Large floating spheres */}
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-blue-500/20 animate-float" />
      <div className="absolute top-40 right-20 w-24 h-24 rounded-full bg-orange-400/30 animate-float-delay" />
      <div className="absolute bottom-32 left-20 w-20 h-20 rounded-full bg-red-400/25 animate-float-delay-2" />
      <div className="absolute bottom-20 right-40 w-28 h-28 rounded-full bg-yellow-400/20 animate-float" />
      <div className="absolute top-60 left-1/3 w-16 h-16 rounded-full bg-purple-500/25 animate-float-delay" />
      
      {/* Medium floating spheres */}
      <div className="absolute top-80 right-1/4 w-12 h-12 rounded-full bg-blue-400/30 animate-float-delay-2" />
      <div className="absolute bottom-60 left-1/2 w-14 h-14 rounded-full bg-orange-300/25 animate-float" />
      <div className="absolute top-32 right-1/3 w-10 h-10 rounded-full bg-red-300/30 animate-float-delay" />
      
      {/* Small floating spheres */}
      <div className="absolute top-96 left-1/4 w-8 h-8 rounded-full bg-yellow-300/35 animate-float-delay-2" />
      <div className="absolute bottom-40 right-1/2 w-6 h-6 rounded-full bg-purple-400/30 animate-float" />
      <div className="absolute top-72 right-10 w-7 h-7 rounded-full bg-blue-300/25 animate-float-delay" />
    </>
  );
};

export default FloatingElements;