import { forwardRef } from "react";
import { Button, type ButtonProps } from "./button";

export type IconButtonProps = Omit<ButtonProps, "size" | "children"> & {
  "aria-label": string;
  icon: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, size = "md", ...props },
  ref,
) {
  const sizeClass = size === "sm" ? "size-8" : size === "lg" ? "size-10" : "size-9";
  return (
    <Button ref={ref} size="icon" {...props} className={`${sizeClass} ${props.className ?? ""}`}>
      {icon}
    </Button>
  );
});
