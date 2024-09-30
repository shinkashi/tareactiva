import React, { useState, useEffect } from 'react';

const WallClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Cleanup the interval when the component is unmounted
    return () => clearInterval(timer);
  }, []);

  return <>{currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}</>;
};

export default WallClock;