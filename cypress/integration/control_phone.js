import doctype_with_phone from '../fixtures/doctype_with_phone';

context("Control Phone", () => {
	before(() => {
		cy.login();
		cy.visit("/app/website");
	});

	function get_dialog_with_phone() {
		return cy.dialog({
			title: "Phone",
			fields: [{
				"fieldname": "phone",
				"fieldtype": "Phone",
			}]
		});
	}

	it("should set flag and data", () => {
		get_dialog_with_phone().as("dialog");
		cy.get(".selected-phone > svg").click();
		cy.get(".phone-picker .phone-wrapper[id='afghanistan']").click();
		cy.get(".phone-picker .phone-wrapper[id='india']").click();
		cy.get(".selected-phone .country").should("have.text", "+91");
		cy.get(".selected-phone > img").should("have.attr", "src").and("include", "/in.svg");

		let phone_number = "9312672712";
		cy.get(".selected-phone > img").click().first();
		cy.get_field("phone")
			.first()
			.click({multiple: true});
		cy.get(".frappe-control[data-fieldname=phone]")
			.findByRole("textbox")
			.first()
			.type(phone_number, {force: true});

		cy.get_field("phone").first().should("have.value", phone_number);
		cy.wait(1000);
		cy.get_field("phone").first().blur({force: true});

		cy.get("@dialog").then(dialog => {
			let value = dialog.get_value("phone");
			expect(value).to.equal("+91-" + phone_number);
		});
	});

	it("case insensitive search for country and clear search", () => {
		let search_text = "india";
		cy.get(".selected-phone > img").click().first();
		cy.get(".phone-picker").findByRole("searchbox").click().type(search_text);
		cy.get(".phone-section .phone-wrapper:not(.hidden)").then(i => {
			cy.get(`.phone-section .phone-wrapper[id*="${search_text.toLowerCase()}"]`).then(countries => {
				expect(i.length).to.equal(countries.length);
			});
		});

		cy.get(".phone-picker").findByRole("searchbox").clear().blur();
		cy.get(".phone-section .phone-wrapper").should("not.have.class", "hidden");
	});

	it("Already existing docs with phone field", () => {
		cy.visit("/app/doctype");
		cy.insert_doc("DocType", doctype_with_phone, true);
		cy.clear_cache();

		// Creating custom doctype
		cy.insert_doc("DocType", doctype_with_phone, true);
		cy.visit("/app/doctype-with-phone");
		cy.click_listview_primary_button("Add Doctype With Phone");

		//Adding a new entry for the created custom doctype
		cy.fill_field("title", "Test Phone 1");
		cy.fill_field("phone", "+91-9823341234");
		cy.wait(500);
		cy.get_field("phone").should("have.value", "9823341234");
		cy.click_doc_primary_button("Save");
		cy.wait(500);
		cy.get_doc("Doctype With Phone", "Test Phone 1").then((doc) => {
			let value = doc.data.phone;
			expect(value).to.equal("+91-9823341234");
		});
		cy.go_to_list("Doctype With Phone");
		cy.click_listview_primary_button("Add Doctype With Phone");
		// Field should be empty on new doc
		cy.get_field("phone").should("have.value", "");
		cy.get(".selected-phone .country").should("have.text", "");
		cy.fill_field("title", "Test Phone 2");
		cy.fill_field("phone", "+91-9823341291");
		cy.wait(500);
		cy.get_field("phone").should("have.value", "9823341291");
		cy.intercept("POST", "/api/method/frappe.desk.form.save.savedocs").as("save_form");
		cy.click_doc_primary_button("Save");
		cy.wait("@save_form");
		cy.go_to_list("Doctype With Phone");
		cy.clear_cache();
		cy.click_listview_row_item(0);
		cy.title().should("eq", "Test Phone 2");
		cy.get(".selected-phone .country").should("have.text", "+91");
		cy.get(".selected-phone > img").should("have.attr", "src").and("include", "/in.svg");
		cy.get_field("phone").should("have.value", "9823341291");
		cy.go_to_list("Doctype With Phone");
		cy.click_listview_row_item(1);
		cy.title().should("eq", "Test Phone 1");
		cy.get(".selected-phone .country").should("have.text", "+91");
		cy.get(".selected-phone > img").should("have.attr", "src").and("include", "/in.svg");
		cy.get_field("phone").should("have.value", "9823341234");
		cy.get_doc("Doctype With Phone", "Test Phone 2").then((doc) => {
			let value = doc.data.phone;
			expect(value).to.equal("+91-9823341291");
			cy.remove_doc("Doctype With Phone", "Test Phone 1", true);
			cy.remove_doc("Doctype With Phone", "Test Phone 2", true);
		});
	});
});
