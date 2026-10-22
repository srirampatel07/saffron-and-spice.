import express from 'express';
import { config, orderRules } from '../config.js';

export function publicConfigRouter() {
  const router = express.Router();

  router.get('/', (req, res) => {
    let onlineReason = null;
    if (!config.razorpayTestConfigured) {
      if (config.razorpayLiveKeysPresent) onlineReason = 'live_keys_not_supported';
      else if (config.razorpayKeyId || config.razorpayKeySecret) onlineReason = 'test_keys_required';
      else onlineReason = 'not_configured';
    }

    res.set('Cache-Control', 'no-store');
    res.json({
      currency: 'INR',
      onlinePayment: {
        provider: 'razorpay',
        enabled: config.razorpayTestConfigured,
        testMode: config.razorpayTestConfigured,
        reason: onlineReason,
      },
      payments: {
        cod: true,
        online: config.razorpayTestConfigured,
      },
      adminEnabled: config.adminEnabled,
      orderRules: {
        deliveryFeePaise: orderRules.deliveryFeePaise,
        freeDeliveryThresholdPaise: orderRules.freeDeliveryThresholdPaise,
        taxRateBps: orderRules.taxRateBps,
        maxQuantityPerItem: orderRules.maxQuantityPerItem,
        maxDistinctItems: orderRules.maxDistinctItems,
      },
    });
  });

  return router;
}
