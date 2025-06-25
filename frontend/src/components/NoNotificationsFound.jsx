import { BellIcon } from "lucide-react";

const NoNotificationsFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BellIcon className="h-12 w-12 text-base-content opacity-50 mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
      <p className="text-base-content opacity-70">You don't have any friend requests at the moment.</p>
    </div>
  );
};

export default NoNotificationsFound;
