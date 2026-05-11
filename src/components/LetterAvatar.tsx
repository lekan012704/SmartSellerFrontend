interface LetterAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-2xl",
};

const LetterAvatar = ({ name, size = "md" }: LetterAvatarProps) => {
  const letter = name.charAt(0).toUpperCase();

  return (
    <div
      className={`${sizeClasses[size]} gradient-primary rounded-full flex items-center justify-center font-bold text-primary-foreground shadow-glow`}
    >
      {letter}
    </div>
  );
};

export default LetterAvatar;
