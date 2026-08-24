import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

function Calendar({
  className,
  ...props
}) {
  return (
    <div className={className}>
      <DayPicker
        mode="single"
        {...props}
      />
    </div>
  );
}

export { Calendar };