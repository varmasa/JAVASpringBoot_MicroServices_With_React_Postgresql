
package com.cloudcart.payment.service;

import com.cloudcart.payment.dto.*;
import com.cloudcart.payment.entity.Payment;
import com.cloudcart.payment.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

@Service
public class PaymentService {

    private final PaymentRepository repository;
    private final RazorpayClient razorpayClient;

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    public PaymentService(
            PaymentRepository repository,
            @Value("${razorpay.key-id}") String keyId,
            @Value("${razorpay.key-secret}") String keySecret
    ) throws Exception {
        this.repository = repository;
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.razorpayClient = new RazorpayClient(keyId, keySecret);
    }

    @Transactional
    public CreatePaymentResponse createOrder(CreatePaymentRequest request) {
        BigDecimal amount = request.amount().setScale(2, RoundingMode.UNNECESSARY);

        if (amount.signum() <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Amount must be positive"
            );
        }

        Optional<Payment> existing =
            repository.findByOrderReference(request.orderReference());

        if (existing.isPresent()) {
            Payment p = existing.get();
            if (p.getStatus().equals("CREATED")) {
                return toCreateResponse(p);
            }
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "A payment record already exists for this order"
            );
        }

        try {
            JSONObject options = new JSONObject();
            options.put("amount", amount
                .multiply(new BigDecimal("100"))
                .longValueExact());
            options.put("currency", "INR");
            options.put("receipt", safeReceipt(request.orderReference()));

            Order razorpayOrder = razorpayClient.orders.create(options);
            String razorpayOrderId = razorpayOrder.get("id");

            Payment payment = new Payment(
                request.orderReference(),
                razorpayOrderId,
                amount,
                "INR"
            );

            return toCreateResponse(repository.save(payment));

        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Unable to create payment order with Razorpay"
            );
        }
    }

    @Transactional
    public PaymentStatusResponse verifyPayment(VerifyPaymentRequest request) {
        Payment payment = repository
            .findByRazorpayOrderId(request.razorpayOrderId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Payment order not found"
            ));

        if ("PAID".equals(payment.getStatus())) {
            if (request.razorpayPaymentId().equals(payment.getRazorpayPaymentId())) {
                return toStatusResponse(payment);
            }
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Payment already verified"
            );
        }

        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", payment.getRazorpayOrderId());
            attributes.put("razorpay_payment_id", request.razorpayPaymentId());
            attributes.put("razorpay_signature", request.razorpaySignature());

            boolean valid = Utils.verifyPaymentSignature(attributes, keySecret);

            if (!valid) {
                payment.markFailed();
                repository.save(payment);
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid payment signature"
                );
            }

            payment.markPaid(request.razorpayPaymentId());
            repository.save(payment);

            return toStatusResponse(payment);

        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Payment verification failed"
            );
        }
    }

    @Transactional(readOnly = true)
    public PaymentStatusResponse getStatus(String razorpayOrderId) {
        Payment payment = repository
            .findByRazorpayOrderId(razorpayOrderId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Payment not found"
            ));
        return toStatusResponse(payment);
    }

    private CreatePaymentResponse toCreateResponse(Payment p) {
        return new CreatePaymentResponse(
            p.getOrderReference(),
            p.getRazorpayOrderId(),
            keyId,
            p.getAmount().multiply(new BigDecimal("100")).longValueExact(),
            p.getCurrency(),
            p.getStatus()
        );
    }

    private PaymentStatusResponse toStatusResponse(Payment p) {
        return new PaymentStatusResponse(
            p.getOrderReference(),
            p.getRazorpayOrderId(),
            p.getRazorpayPaymentId(),
            p.getAmount(),
            p.getCurrency(),
            p.getStatus()
        );
    }

    private String safeReceipt(String reference) {
        String sanitized = reference.replaceAll("[^A-Za-z0-9_-]", "_");
        return sanitized.length() > 40
            ? sanitized.substring(0, 40)
            : sanitized;
    }
}