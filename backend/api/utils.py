from datetime import datetime, time, timedelta
from django.utils import timezone

# --- Configuration ---
# Define your company's working hours (9:00 AM to 5:00 PM)
BUSINESS_START_HOUR = 9
BUSINESS_END_HOUR = 17
# Calculate the total number of business hours in a single day
HOURS_PER_BUSINESS_DAY = BUSINESS_END_HOUR - BUSINESS_START_HOUR # This is 8 hours

class DateCalculator:
    """
    A utility class to handle business-aware date calculations.
    It knows about weekends and 9-to-5 business hours.
    """

    def get_next_business_day_start(self, dt):
        """
        Given a datetime, finds the 9:00 AM start of the next valid business day.
        If it's Friday, this will return 9:00 AM on Monday.
        """
        # Move to the next day
        next_day = dt.date() + timedelta(days=1)
        
        # Loop forward until we find a weekday (0=Mon, 1=Tue, ..., 6=Sun)
        while next_day.weekday() >= 5: # 5=Saturday, 6=Sunday
            next_day += timedelta(days=1)
            
        # Return the 9:00 AM start of that business day, preserving timezone
        return datetime.combine(next_day, time(BUSINESS_START_HOUR, 0), tzinfo=dt.tzinfo)

    def add_business_hours(self, start_dt, hours_to_add):
        """
        The main "brain" function.
        Adds a number of business hours to a starting datetime.
        """
        
        # 0. Ensure we have a valid, timezone-aware start time
        if not timezone.is_aware(start_dt):
            # This is a fallback, but we should always use timezone-aware datetimes
            start_dt = timezone.make_aware(start_dt)

        current_dt = start_dt
        remaining_hours = hours_to_add

        # 1. Handle non-business start times
        # If we start on a weekend, move to 9 AM next Monday
        if current_dt.weekday() >= 5:
            current_dt = self.get_next_business_day_start(current_dt)
        # If we start after hours (e.g., 8 PM), move to 9 AM next business day
        elif current_dt.time() >= time(BUSINESS_END_HOUR, 0):
            current_dt = self.get_next_business_day_start(current_dt)
        # If we start before hours (e.g., 7 AM), move to 9 AM this day
        elif current_dt.time() < time(BUSINESS_START_HOUR, 0):
            current_dt = current_dt.replace(hour=BUSINESS_START_HOUR, minute=0, second=0, microsecond=0)

        # 2. Main loop: Add hours chunk by chunk
        while remaining_hours > 0:
            # How many hours are left in *this* business day?
            # e.g., if it's 3:00 PM (15:00), and business ends at 5:00 PM (17:00),
            # there are 2 hours left.
            business_end_dt = current_dt.replace(hour=BUSINESS_END_HOUR, minute=0, second=0, microsecond=0)
            hours_left_in_day = (business_end_dt - current_dt).total_seconds() / 3600.0

            if hours_left_in_day >= remaining_hours:
                # This is the easy case: We can fit all remaining hours in today.
                current_dt += timedelta(hours=remaining_hours)
                remaining_hours = 0
            else:
                # This is the "spill-over" case:
                # We use up all remaining hours today and move to the next day.
                remaining_hours -= hours_left_in_day
                current_dt = self.get_next_business_day_start(current_dt)
        
        return current_dt

# --- Example Usage (You can delete this part, it's just for testing) ---
if __name__ == "__main__":
    calculator = DateCalculator()
    
    # 1. Simple test: 2 hours from 10 AM
    start1 = timezone.make_aware(datetime(2025, 11, 13, 10, 0)) # Thursday 10 AM
    end1 = calculator.add_business_hours(start1, 2)
    print(f"Test 1: {start1} + 2 hours = {end1}") # Expected: 2025-11-13 12:00

    # 2. Spill-over test: 4 hours from 3 PM
    start2 = timezone.make_aware(datetime(2025, 11, 13, 15, 0)) # Thursday 3 PM
    # (2 hours left today, 2 hours tomorrow)
    end2 = calculator.add_business_hours(start2, 4)
    print(f"Test 2: {start2} + 4 hours = {end2}") # Expected: 2025-11-14 11:00

    # 3. Weekend test: 4 hours from Friday 3 PM
    start3 = timezone.make_aware(datetime(2025, 11, 14, 15, 0)) # Friday 3 PM
    # (2 hours left on Friday, 2 hours on Monday)
    end3 = calculator.add_business_hours(start3, 4)
    print(f"Test 3: {start3} + 4 hours = {end3}") # Expected: 2025-11-17 11:00