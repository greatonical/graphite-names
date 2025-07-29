export function formatRelativeDate(inputDate: string): string {
  const date = new Date(inputDate);
  const now = new Date();

  // Calculate difference in days
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Manually format the date to dd.mm.yyyy
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const year = date.getFullYear();

  // Format the time to h:mmAM/PM
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Convert to 12-hour format

  const formattedDate = `${day}.${month}.${year}, ${hours}:${minutes}${ampm}`;

  // Determine relative time
  let relative = "";
  if (diffDays === 0) {
    relative = "Today";
  } else if (diffDays === 1) {
    relative = "1 day ago";
  } else if (diffDays > 1) {
    relative = `${diffDays} days ago`;
  } else {
    relative = `${Math.abs(diffDays)} days`;
  }

  return `${relative} (${formattedDate})`;
}

export function formatDateToUnixTimestamp(dateString: string): number {
  return Math.floor(new Date(dateString).getTime() / 1000);
}
