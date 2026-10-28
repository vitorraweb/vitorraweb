<?php

namespace App\Services\GoogleAds;

use RuntimeException;

/** A Google Ads call failed. The message is written to be shown to staff as-is. */
class GoogleAdsException extends RuntimeException
{
}
