import { useState } from "react";

export const useSelection = <T extends { id: string }>(items: T[]) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    setSelectedKeys(checked === true ? items.map((item) => item.id) : []);
  };

  const handleSelectRow = (id: string, checked: boolean | "indeterminate") => {
    setSelectedKeys((prev) =>
      checked === true ? [...prev, id] : prev.filter((key) => key !== id)
    );
  };

  const isSelected = (id: string) => selectedKeys.includes(id);

  const clearSelection = () => setSelectedKeys([]);

  return {
    selectedKeys,
    isDeleting,
    setIsDeleting,
    handleSelectAll,
    handleSelectRow,
    isSelected,
    clearSelection,
  };
};
