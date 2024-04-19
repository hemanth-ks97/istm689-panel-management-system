/* 
 react-beautiful-dnd library is not supported with React's StrictMode 
 This is a work around to ensure that Droppable components are only mounted after React's StrictMode has completed its initial double invocation of lifecycle methods. 
 By delaying the rendering of Droppable until after the next repaint, it aims to prevent any potential issues that might arise from StrictMode's behavior with react-beautiful-dnd during development. 
 This approach uses requestAnimationFrame to defer setting the component state that controls the rendering of Droppable.
*/
import React, { useEffect, useState } from "react";
import { Droppable } from "react-beautiful-dnd";

const StrictModeDroppable = (props) => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => setIsEnabled(true));
    return () => {
      cancelAnimationFrame(handle);
      setIsEnabled(false);
    };
  }, []);

  if (!isEnabled) {
    return null;
  }

  return <Droppable {...props}>{props.children}</Droppable>;
};

export default StrictModeDroppable;
