// Copyright (c) 2010, SoftLayer Technologies, Inc. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//  * Redistributions of source code must retain the above copyright notice,
//    this list of conditions and the following disclaimer.
//  * Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
//  * Neither SoftLayer Technologies, Inc. nor the names of its contributors may
//    be used to endorse or promote products derived from this software without
//    specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

// This function is responsible for populating the flyout.
// The details displayed come from hidden fields on the parent form.
// Be sure never to try and touch the flyout DOM directly from the
// main HTML DOM since the flyout can "go away" whenever the user 
// decides to move focus.
function loadFlyout()
{
    // set appropriate size for docked state
    with(document.body.style) width=250, height=100;  
	var element;
	var parent = System.Gadget.document;
	element = document.getElementById("account_name_div");
	var companyName = parent.getElementById("company_name").value;
	element.innerHTML = companyName;
	element = document.getElementById("update_time_div");
	element.innerHTML = parent.getElementById("modify_date").value;
	element = document.getElementById("ticket_summary_div");
	element.innerHTML = parent.getElementById("ticket_title").value;
	element = document.getElementById("login_portal_div");
	var ticketId = parent.getElementById("ticket_id").value;
	if (parent.getElementById("resource_provider").value == 1)
	{
		element.innerHTML = element.innerHTML = "<a href='https://manage.softlayer.com/Support/editTicket/"+ticketId+"' style='border:0px; font-size:12px; color:#972f2c; text-weight:bold; text-decoration:underline';>Login to Portal</a>";
	}
	if (parent.getElementById("resource_provider").value == 2)
	{
		element.innerHTML = "<a href='https://orbit.theplanet.com/Support/OrbitTicketDetails.aspx?id="+ticketId+"' style='border:0px; font-size:12px; color:#972f2c; text-weight:bold; text-decoration:underline';>Login to Portal</a>";
	}
	
}