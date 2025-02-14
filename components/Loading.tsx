import classNames from "classnames";

type Props = {
  size?: number;
  fill?: "white" | "primary";
  text?: string;
  withText?: boolean;
  withFullHeight?: boolean;
};

const Loading = ({
  fill = "primary",
  size = 125,
  withText = false,
  text = "Loading...",
  withFullHeight = true,
}: Props) => {
  return (
    <div
      className={classNames(
        withFullHeight ? "flex-1 h-full" : "",
        "grid place-content-center"
      )}
    >
      <div className="flex items-center gap-2">
        <div
          style={{
            width: size,
          }}
          className={`aspect-[1] max-w-full animate-spin border-4 ${
            fill === "white" ? "border-white" : "border-primary"
          } border-t-transparent rounded-full`}
        />
        {withText && (
          <b
            className={classNames(
              fill === "white" ? "text-white" : "text-primary"
            )}
          >
            {text}
          </b>
        )}
      </div>
    </div>
  );
};
export default Loading;
