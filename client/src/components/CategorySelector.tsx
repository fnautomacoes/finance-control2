import { useState, useMemo } from "react";
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
  color: string;
  type: "income" | "expense";
  parentId?: number | null;
}

interface CategorySelectorProps {
  categories: Category[];
  value?: number;
  onChange: (categoryId: number | undefined) => void;
  filterType?: "income" | "expense";
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

interface CategoryGroup {
  parent: Category;
  children: Category[];
}

export function CategorySelector({
  categories,
  value,
  onChange,
  filterType,
  placeholder = "Selecione uma categoria",
  disabled = false,
  className,
  triggerClassName,
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");

  // Filter and organize categories
  const { parentCategories, childrenByParent, standaloneCategories } = useMemo(() => {
    const filtered = filterType
      ? categories.filter(c => c.type === filterType)
      : categories;

    const parents: Category[] = [];
    const childMap = new Map<number, Category[]>();
    const standalone: Category[] = [];

    // First pass: identify parents and children
    filtered.forEach(cat => {
      if (cat.parentId) {
        const existing = childMap.get(cat.parentId) || [];
        childMap.set(cat.parentId, [...existing, cat]);
      }
    });

    // Second pass: categorize
    filtered.forEach(cat => {
      if (!cat.parentId) {
        if (childMap.has(cat.id)) {
          parents.push(cat);
        } else {
          standalone.push(cat);
        }
      }
    });

    return {
      parentCategories: parents,
      childrenByParent: childMap,
      standaloneCategories: standalone,
    };
  }, [categories, filterType]);

  // Filter by search
  const filteredData = useMemo(() => {
    if (!search.trim()) {
      return { parentCategories, childrenByParent, standaloneCategories };
    }

    const searchLower = search.toLowerCase();
    const matchingParents: Category[] = [];
    const matchingChildren = new Map<number, Category[]>();
    const matchingStandalone: Category[] = [];

    // Check standalone categories
    standaloneCategories.forEach(cat => {
      if (cat.name.toLowerCase().includes(searchLower)) {
        matchingStandalone.push(cat);
      }
    });

    // Check parent categories and their children
    parentCategories.forEach(parent => {
      const children = childrenByParent.get(parent.id) || [];
      const matchingChildList = children.filter(child =>
        child.name.toLowerCase().includes(searchLower)
      );

      if (parent.name.toLowerCase().includes(searchLower)) {
        matchingParents.push(parent);
        matchingChildren.set(parent.id, children);
      } else if (matchingChildList.length > 0) {
        matchingParents.push(parent);
        matchingChildren.set(parent.id, matchingChildList);
      }
    });

    return {
      parentCategories: matchingParents,
      childrenByParent: matchingChildren,
      standaloneCategories: matchingStandalone,
    };
  }, [search, parentCategories, childrenByParent, standaloneCategories]);

  // Find selected category
  const selectedCategory = useMemo(() => {
    if (!value) return null;
    return categories.find(c => c.id === value) || null;
  }, [value, categories]);

  // Find parent of selected category (if it's a child)
  const selectedParent = useMemo(() => {
    if (!selectedCategory?.parentId) return null;
    return categories.find(c => c.id === selectedCategory.parentId) || null;
  }, [selectedCategory, categories]);

  const toggleGroup = (parentId: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(parentId)) {
        next.delete(parentId);
      } else {
        next.add(parentId);
      }
      return next;
    });
  };

  const handleSelect = (categoryId: number) => {
    onChange(categoryId === value ? undefined : categoryId);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  // Auto-expand groups when searching or when a child is selected
  useMemo(() => {
    if (search.trim()) {
      // Expand all groups when searching
      const allParentIds = new Set(filteredData.parentCategories.map(p => p.id));
      setExpandedGroups(allParentIds);
    } else if (selectedCategory?.parentId) {
      // Expand the group containing the selected category
      setExpandedGroups(prev => new Set(prev).add(selectedCategory.parentId!));
    }
  }, [search, selectedCategory?.parentId, filteredData.parentCategories]);

  const hasResults =
    filteredData.parentCategories.length > 0 ||
    filteredData.standaloneCategories.length > 0;

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground",
              triggerClassName
            )}
          >
            <div className="flex items-center gap-2 truncate">
              {selectedCategory ? (
                <>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedCategory.color }}
                  />
                  <span className="truncate">
                    {selectedParent ? (
                      <>
                        <span className="text-muted-foreground">{selectedParent.name} → </span>
                        {selectedCategory.name}
                      </>
                    ) : (
                      selectedCategory.name
                    )}
                  </span>
                </>
              ) : (
                <span>{placeholder}</span>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              {value && !disabled && (
                <X
                  className="h-4 w-4 opacity-50 hover:opacity-100"
                  onClick={handleClear}
                />
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar categoria..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>

              {/* Standalone Categories (no children) */}
              {filteredData.standaloneCategories.length > 0 && (
                <CommandGroup heading="Categorias">
                  {filteredData.standaloneCategories.map(category => (
                    <CommandItem
                      key={category.id}
                      value={category.id.toString()}
                      onSelect={() => handleSelect(category.id)}
                      className="flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="flex-1 truncate">{category.name}</span>
                      {value === category.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Parent Categories with Children */}
              {filteredData.parentCategories.length > 0 && (
                <CommandGroup heading="Grupos">
                  {filteredData.parentCategories.map(parent => {
                    const children = filteredData.childrenByParent.get(parent.id) || [];
                    const isExpanded = expandedGroups.has(parent.id);

                    return (
                      <div key={parent.id}>
                        {/* Parent Item - Clickable to expand/collapse */}
                        <CommandItem
                          value={`parent-${parent.id}`}
                          onSelect={() => toggleGroup(parent.id)}
                          className="flex items-center gap-2"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          )}
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: parent.color }}
                          />
                          <span className="flex-1 font-medium truncate">{parent.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {children.length}
                          </span>
                        </CommandItem>

                        {/* Children Items */}
                        {isExpanded && children.map(child => (
                          <CommandItem
                            key={child.id}
                            value={child.id.toString()}
                            onSelect={() => handleSelect(child.id)}
                            className="flex items-center gap-2 pl-9"
                          >
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: child.color }}
                            />
                            <span className="flex-1 truncate">{child.name}</span>
                            {value === child.id && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </CommandItem>
                        ))}
                      </div>
                    );
                  })}
                </CommandGroup>
              )}

              {!hasResults && !search && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma categoria disponível
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
