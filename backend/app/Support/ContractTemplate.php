<?php

namespace App\Support;

/**
 * Finance's FET Module Sales and Installation Agreement ("FUEL ECO TECH sales
 * agreement template.docx", 23 October 2026), as the starting point for every
 * new contract. Wording is Finance's, verbatim; staff can change any clause
 * on a single contract, and the editor marks clauses that differ from this.
 *
 * Clause bodies are plain text: one paragraph per line, "- " starts a bullet.
 * Sections 2–4 also print the product, price and payment details from the
 * contract's own fields (ContractDocument), after or before the clause text.
 */
class ContractTemplate
{
    public const TITLE = 'FUEL ECO TECH (FET) MODULE SALES AND INSTALLATION AGREEMENT';

    /** Starting values for the fill-in fields. */
    public static function defaults(): array
    {
        return [
            'seller_company'      => 'Vitorra Holding Ltd',
            'seller_address'      => "Plot 22 Lumumba Avenue\nP.O. Box 197437, Kampala GPO\nKampala, Uganda",
            'seller_name'         => 'Nakayima Thurayya',
            'seller_title'        => 'Marketing and Sales Manager',
            'quantity'            => 1,
            'currency'            => 'UGX',
            'payment_option'      => 'advance',
            'bank_account_name'   => 'Vitorra Holding Ltd',
            'bank_name'           => 'Stanbic Uganda limited',
            'bank_account_number' => '9030027300994',
            'clauses'             => self::clauses(),
        ];
    }

    /** @return list<array{key:string,title:string,body:string}> */
    public static function clauses(): array
    {
        return [
            ['key' => 'purpose', 'title' => 'PURPOSE', 'body' => 'The Seller agrees to sell and install the Fuel Eco Tech Module ("FET Module") and the Buyer agrees to purchase the Product under the terms and conditions of this Agreement.'],
            ['key' => 'product', 'title' => 'PRODUCT DETAILS', 'body' => "The Product Model Number and Serial Number recorded above shall be deemed the official identification details of the FET Module supplied and installed under this Agreement.\nAny warranty claim, return request, service request, replacement request, or technical support request must reference the Product Model Number and Serial Number stated herein."],
            ['key' => 'price', 'title' => 'PURCHASE PRICE', 'body' => 'The Buyer agrees to purchase the Product under the following pricing:'],
            ['key' => 'payment', 'title' => 'PAYMENT TERMS', 'body' => 'The Buyer shall bear all bank transfer charges, currency conversion costs, and related payment expenses.'],
            ['key' => 'ownership', 'title' => 'OWNERSHIP OF THE PRODUCT', 'body' => "Ownership of the FET Module shall remain with Vitorra Holding Ltd until full payment of all amounts due under this Agreement has been received.\nThe Seller reserves the right to remove, recover, or repossess the Product in the event of payment default, subject to applicable law."],
            ['key' => 'delivery', 'title' => 'DELIVERY AND INSTALLATION', 'body' => "6.1 The Seller shall deliver and install the Product at the agreed location.\n6.2 Installation shall commence within 3 business days following confirmation of payment.\n6.3 The Buyer shall provide reasonable access to vehicles, machinery, equipment, facilities, and personnel necessary for installation.\n6.4 Upon completion of installation, the Buyer shall sign an Installation Completion Certificate confirming satisfactory installation.\n6.5 Risk of loss or damage shall pass to the Buyer upon completion of installation.\n6.6 The loss or damage is claimable through Vitorra legal team is a 30-day return policy isn't met."],
            ['key' => 'performance', 'title' => 'PRODUCT PERFORMANCE DISCLAIMER', 'body' => "The Buyer acknowledges that actual fuel savings and operational improvements may vary depending upon:\n- Vehicle condition;\n- Engine type;\n- Maintenance history;\n- Driving habits;\n- Fuel quality;\n- Operating environment;\n- Vehicle load and usage patterns.\nThe Seller makes no guarantee of a specific percentage of fuel savings unless expressly provided in writing."],
            ['key' => 'warranty', 'title' => 'WARRANTY', 'body' => "The Seller warrants that the FET Module shall be free from manufacturing defects for a period of four (4) years from the installation date.\nThe warranty covers:\n- Manufacturing defects;\n- Defective components;\n- Faulty workmanship during installation.\nThe warranty does not cover:\n- Accidental damage;\n- Unauthorized repairs;\n- Improper use;\n- Negligence;\n- Tampering;\n- Installation performed by unauthorized persons;\n- Electrical system modifications not approved by Seller."],
            ['key' => 'returns', 'title' => 'RETURN POLICY', 'body' => "The Buyer may return eligible products within thirty (30) days from the date of purchase, provided the products are returned in their original condition and accompanied by valid proof of purchase.\nProducts that have been damaged through misuse, negligence, unauthorized modification, improper handling, accident, tampering, or installation by unauthorized persons shall not be eligible for return.\nFor installed FET Modules, the Buyer shall first allow the Seller to inspect the Product and verify the basis of the return request.\nUpon approval of the return, the Seller may, at its sole discretion:\n- Replace the Product with an equivalent Product;\n- Issue store credit equal to the purchase value of the returned Product; or\n- Provide a refund of the purchase price paid for the Product.\nAny approved refund shall be processed within thirty (30) business days after confirmation of eligibility.\nThe Seller reserves the right to deduct any costs associated with damage, missing components, shipping, customs duties, installation services already performed, or restoration required to return the Product to resale condition.\nThis Return Policy shall be subject to the laws of the Republic of Uganda."],
            ['key' => 'claims', 'title' => 'WARRANTY CLAIM PROCEDURE', 'body' => "The Buyer shall notify the Seller in writing within seven (7) days of discovering any defects.\nThe Seller shall inspect the Product and determine whether repair, replacement, or corrective action is required.\nThe Seller reserves the right to repair defective components before offering replacement."],
            ['key' => 'obligations', 'title' => 'BUYER OBLIGATIONS', 'body' => "The Buyer agrees to:\n- Operate the Product according to instructions provided;\n- Allow inspection where warranty claims arise;\n- Refrain from unauthorized modifications;\n- Maintain the vehicle or equipment in good operating condition;\n- Notify Seller promptly of any performance issues."],
            ['key' => 'liability', 'title' => 'LIMITATION OF LIABILITY', 'body' => "The Seller's total liability under this Agreement shall not exceed the total amount paid by the Buyer for the Product and installation services.\nUnder no circumstances shall the Seller be liable for loss of profits, business interruption, indirect damages, consequential damages, loss of contracts, or loss of goodwill."],
            ['key' => 'confidentiality', 'title' => 'CONFIDENTIALITY', 'body' => "Any technical information, installation methods, proprietary documentation, specifications, pricing structures, or business information disclosed by the Seller shall remain confidential.\nThe Buyer shall not disclose such information to any third party without prior written consent from the Seller."],
            ['key' => 'force_majeure', 'title' => 'FORCE MAJEURE', 'body' => 'Neither Party shall be liable for delays or failure to perform resulting from causes beyond its reasonable control including acts of God, floods, fire, war, government restrictions, pandemics, transportation disruptions, or supplier delays.'],
            ['key' => 'default', 'title' => 'DEFAULT', 'body' => "The Buyer shall be considered in default if:\n- Payment is not made when due;\n- False information is provided;\n- The Product is intentionally damaged;\n- The Buyer breaches a material term of this Agreement.\nUpon default, the Seller may suspend services, terminate this Agreement, and pursue recovery of outstanding amounts."],
            ['key' => 'disputes', 'title' => 'DISPUTE RESOLUTION', 'body' => "The Parties shall first attempt to resolve disputes amicably through negotiation.\nIf unresolved within thirty (30) days, the dispute shall be submitted to mediation.\nShould mediation fail, the matter shall be referred to the competent courts of Uganda."],
            ['key' => 'law', 'title' => 'GOVERNING LAW', 'body' => 'This Agreement shall be governed by and construed in accordance with the laws of the Republic of Uganda.'],
            ['key' => 'entire', 'title' => 'ENTIRE AGREEMENT', 'body' => "This Agreement constitutes the entire agreement between the Parties and supersedes all prior negotiations, discussions, proposals, and understandings.\nNo amendment shall be valid unless made in writing and signed by both Parties."],
        ];
    }
}
