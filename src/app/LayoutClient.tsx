"use client";

import { useState, useEffect } from "react";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [profileOpen, setProfileOpen] = useState(false); // State for My Profile modal
  const [createGroupOpen, setCreateGroupOpen] = useState(false); // State for Create Group modal



  const mockUser = { nickname: "JohnDoe", email: "john@example.com" };

  const handleCreateGroup = (groupName: string, participants: string[]) => {
    console.log("Group Created:", { groupName, participants });
  };

  const handleLogout = () => {
    console.log("Logged out");
  };

  const handleChangePassword = (newPassword: string) => {
    console.log("Password changed to:", newPassword);
  };

  useEffect(() => {
    // Event listeners for modals
    const toggleProfileListener = () => setProfileOpen(true);
    const toggleNewGroupListener = () => setCreateGroupOpen(true);

    window.addEventListener("toggle-profile", toggleProfileListener);
    window.addEventListener("toggle-new-group", toggleNewGroupListener);

    return () => {
      window.removeEventListener("toggle-profile", toggleProfileListener);
      window.removeEventListener("toggle-new-group", toggleNewGroupListener);
    };
  }, []);

  return (
    <>
      {children}
    </>
  );
}
