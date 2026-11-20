from django.db import models
from django.utils import timezone


class UserRecord(models.Model):
    """Mirror of the legacy `users` table."""

    username = models.CharField(max_length=255, unique=True, db_index=True)
    email = models.CharField(max_length=255, unique=True, db_index=True)
    hashed_password = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "users"
        ordering = ["id"]

    def __str__(self):
        return self.username


class CallSign(models.Model):
    call_sign = models.CharField(max_length=255, blank=True, default="", db_index=True)
    flight_rule = models.CharField(max_length=255, blank=True, default="")
    flight_type = models.CharField(max_length=255, blank=True, default="")
    aircraft_type = models.CharField(max_length=255, blank=True, default="")
    weight_category = models.CharField(max_length=255, blank=True, default="")
    equipments = models.CharField(max_length=255, blank=True, default="")
    departure = models.CharField(max_length=255, blank=True, default="")
    dep_time = models.CharField(max_length=255, blank=True, default="")
    date_of_flight = models.CharField(max_length=255, blank=True, default="")
    speed = models.CharField(max_length=255, blank=True, default="")
    level = models.CharField(max_length=255, blank=True, default="")
    route = models.CharField(max_length=255, blank=True, default="")
    destination = models.CharField(max_length=255, blank=True, default="")
    total_flying_time = models.CharField(max_length=255, blank=True, default="")
    alternate_1 = models.CharField(max_length=255, null=True, blank=True)
    alternate_2 = models.CharField(max_length=255, null=True, blank=True)
    dep_station = models.CharField(max_length=255, blank=True, default="")
    dep_lat_long = models.CharField(max_length=255, blank=True, default="")
    dest_station = models.CharField(max_length=255, blank=True, default="")
    dest_lat_long = models.CharField(max_length=255, blank=True, default="")
    alternate_station = models.CharField(max_length=255, null=True, blank=True)
    pilot_in_command = models.CharField(max_length=255, blank=True, default="")
    mobile_no = models.CharField(max_length=255, blank=True, default="")
    co_pilot = models.CharField(max_length=255, null=True, blank=True)
    cabin_crew = models.CharField(max_length=255, null=True, blank=True)
    endurance = models.CharField(max_length=255, null=True, blank=True)
    performance = models.CharField(max_length=255, null=True, blank=True)
    registration = models.CharField(max_length=255, null=True, blank=True)
    operator = models.CharField(max_length=255, null=True, blank=True)
    remarks = models.CharField(max_length=255, null=True, blank=True)

    uhf_cb = models.BooleanField(default=False)
    vhf_cb = models.BooleanField(default=False)
    elba_cb = models.BooleanField(default=False)
    polar_cb = models.BooleanField(default=False)
    desert_cb = models.BooleanField(default=False)
    maritime_cb = models.BooleanField(default=False)
    jungle_cb = models.BooleanField(default=False)
    light_cb = models.BooleanField(default=False)
    fluores_cb = models.BooleanField(default=False)
    cover_cb = models.BooleanField(default=False)

    number = models.CharField(max_length=255, null=True, blank=True)
    capacity = models.CharField(max_length=255, null=True, blank=True)
    color = models.CharField(max_length=255, null=True, blank=True)

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "call_signs"
        ordering = ["id"]

    def __str__(self):
        return self.call_sign


class OnlineFpl(models.Model):
    call_sign = models.CharField(max_length=255, blank=True, default="", db_index=True)
    departure_from = models.CharField(max_length=255, blank=True, default="")
    destination_to = models.CharField(max_length=255, blank=True, default="")
    dep_time_utc = models.CharField(max_length=255, blank=True, default="")
    date_of_flight = models.CharField(max_length=255, blank=True, default="")
    pilot_name = models.CharField(max_length=255, blank=True, default="")
    mobile_number = models.CharField(max_length=255, blank=True, default="")
    co_pilot_name = models.CharField(max_length=255, null=True, blank=True)
    cabin_name = models.CharField(max_length=255, null=True, blank=True)
    remarks = models.CharField(max_length=255, null=True, blank=True)

    dpfz_zzzz_place_name = models.CharField(max_length=255, null=True, blank=True)
    dpfz_zzzz_lat_long = models.CharField(max_length=255, null=True, blank=True)
    drst_zzzz_place_name = models.CharField(max_length=255, null=True, blank=True)
    drst_zzzz_lat_long = models.CharField(max_length=255, null=True, blank=True)

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "online_fpls"
        ordering = ["id"]

    def __str__(self):
        return self.call_sign


class Aircraft(models.Model):
    operator = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    registration_number = models.CharField(max_length=255, unique=True, db_index=True)
    aircraft_type = models.CharField(max_length=255)
    wake_category = models.CharField(max_length=255, null=True, blank=True)

    rcn_equipment_capabilities = models.CharField(max_length=255, null=True, blank=True)
    surveillance_equipment_capabilities = models.CharField(max_length=255, null=True, blank=True)
    pbn = models.CharField(max_length=255, null=True, blank=True)
    nav = models.CharField(max_length=255, null=True, blank=True)
    gps = models.CharField(max_length=255, null=True, blank=True)
    com = models.CharField(max_length=255, null=True, blank=True)
    selcal = models.CharField(max_length=255, null=True, blank=True)

    remarks = models.CharField(max_length=255, null=True, blank=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "aircrafts"
        ordering = ["id"]

    def __str__(self):
        return self.registration_number


class Airport(models.Model):
    fir = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    icao_code = models.CharField(max_length=255, db_index=True)
    airport_name = models.CharField(max_length=255)
    city = models.CharField(max_length=255, null=True, blank=True)
    country = models.CharField(max_length=255, null=True, blank=True)
    elevation = models.CharField(max_length=255, null=True, blank=True)
    transition_altitude = models.CharField(max_length=255, null=True, blank=True)
    aftn_addresses = models.TextField(null=True, blank=True)
    remarks = models.CharField(max_length=255, null=True, blank=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "airports"
        ordering = ["id"]

    def __str__(self):
        return f"{self.icao_code} - {self.airport_name}"


class Pilot(models.Model):
    name = models.CharField(max_length=255, db_index=True)
    license_number = models.CharField(max_length=255, unique=True, db_index=True)
    rank = models.CharField(max_length=255, null=True, blank=True)
    contact_number = models.CharField(max_length=255, null=True, blank=True)
    email = models.CharField(max_length=255, null=True, blank=True)
    base_station = models.CharField(max_length=255, null=True, blank=True)
    remarks = models.CharField(max_length=255, null=True, blank=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "pilots"
        ordering = ["id"]

    def __str__(self):
        return self.name
