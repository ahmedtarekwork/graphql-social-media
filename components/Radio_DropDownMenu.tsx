// react
import { forwardRef, memo, useImperativeHandle, useState } from "react";

// components
// shadcn
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  options: {
    text: string;
    option: string;
    id: string;
    defaultSelected?: boolean;
  }[];
  label: string;
};

export type Radio_DropDownMenuRefType = { selected: string };

const Radio_DropDownMenu = forwardRef<Radio_DropDownMenuRefType, Props>(
  ({ options, label }, ref) => {
    const [selected, setSelected] = useState(
      options.find((opt) => opt.defaultSelected)?.option || ""
    );

    useImperativeHandle(ref, () => ({ selected }), [selected]);

    return (
      <div className="flex items-center gap-1">
        {label && <p className="font-bold">{label}:</p>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button title="select option" variant="outline">
              {options.find(({ option }) => option === selected)?.text ||
                label ||
                "Choose an option"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>{label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={selected}
              onValueChange={setSelected}
            >
              {options.map(({ text, option, id }) => (
                <DropdownMenuRadioItem key={id} value={option}>
                  {text}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
);

Radio_DropDownMenu.displayName = "Radio_DropDownMenu";

export default memo(Radio_DropDownMenu);
