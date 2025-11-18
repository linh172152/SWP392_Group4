"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "./utils";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "./popover";
import { Input } from "./input";

interface ComboboxProps {
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Chọn hoặc nhập...",
  searchPlaceholder = "Tìm kiếm...",
  emptyMessage = "Không tìm thấy",
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync input value with prop value
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Deduplicate and filter options based on input
  const filteredOptions = React.useMemo(() => {
    // First, deduplicate options (case-insensitive, trim whitespace)
    const uniqueOptions = Array.from(
      new Map(
        options
          .filter(opt => opt && opt.trim())
          .map(opt => {
            const trimmed = opt.trim();
            return [trimmed.toLowerCase(), trimmed] as [string, string];
          })
      ).values()
    );
    
    // Then filter based on input
    if (!inputValue) return uniqueOptions;
    return uniqueOptions.filter((option) =>
      option.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [options, inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onValueChange(newValue);
    setOpen(true);
  };

  const handleSelect = (option: string) => {
    setInputValue(option);
    onValueChange(option);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue("");
    onValueChange("");
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setOpen(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay to allow click on option
    setTimeout(() => {
      if (!inputRef.current?.contains(e.relatedTarget as Node)) {
        setOpen(false);
      }
    }, 200);
  };

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "pr-8 bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50",
                className
              )}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {inputValue && (
                <X
                  className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100 cursor-pointer"
                  onClick={handleClear}
                />
              )}
              <ChevronsUpDown 
                className="h-4 w-4 shrink-0 opacity-50 cursor-pointer"
                onClick={() => setOpen(!open)}
              />
            </div>
          </div>
        </PopoverAnchor>
        {open && (
          <PopoverContent 
            className="w-[var(--radix-popover-anchor-width)] p-0 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">
                {emptyMessage}
              </div>
            ) : (
              <div className="max-h-[300px] overflow-auto">
                <div className="p-1">
                  {filteredOptions.map((option) => (
                    <div
                      key={option}
                      className={cn(
                        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer",
                        value === option && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => handleSelect(option)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}

