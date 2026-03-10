(() => {
  window.Glimpse = window.Glimpse || {};
  window.Glimpse.config = {
    defaultSampleTime: 0.01,
    maxHeaderScanLines: 50,
    defaultHeader: [
      "TIME",
      "PITCH",
      "ROLL",
      "YAW",
      "YAW_CALIBRATION_OFFSET",
      "ACCEL_X",
      "ACCEL_Y",
      "ACCEL_Z",
      "PWM_LEFT",
      "PWM_RIGHT",
      "ENCODER_LEFT",
      "DIRECTION_LEFT",
      "ENCODER_RIGHT",
      "DIRECTION_RIGHT",
      "CURRENT_LEFT",
      "CURRENT_RIGHT",
      "CURRENT_MF",
      "CURRENT_MAGNET",
      "SENSOR_LEFT",
      "SENSOR_RIGHT",
      "BATTERY",
      "GAP_DETECT"
    ]
  };
})();
