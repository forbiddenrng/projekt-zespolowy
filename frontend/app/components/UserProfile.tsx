"use client"
import { useEffect, useState } from "react";

export default function UserProfile() {

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      setProfile(data);
      console.log(data);
    }
    fetchProfile();
  }, []);

  return (
    <div>
      {JSON.stringify(profile)}
    </div>
  )
};
