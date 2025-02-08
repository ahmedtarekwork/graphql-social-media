type Props = {
  size?: number;
  fill?: "white" | "primary";
};

const Loading = ({ fill = "primary", size = 125 }: Props) => {
  return (
    <div className="flex-1 grid place-content-center">
      <div
        style={{
          width: size,
        }}
        className={`aspect-[1] max-w-full animate-spin border-4 ${
          fill === "white" ? "border-white" : "border-primary"
        } border-t-transparent rounded-full`}
      />
    </div>
  );
};
export default Loading;
